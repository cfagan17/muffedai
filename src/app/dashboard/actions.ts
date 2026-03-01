"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  lookupSleeperUser,
  getSleeperLeagues,
  importRosterFromLeague,
} from "@/lib/sleeper-league";

export async function searchPlayers(query: string) {
  if (!query || query.length < 2) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("nfl_players")
    .select("id, name, team, position")
    .ilike("name", `%${query}%`)
    .order("name")
    .limit(10);

  if (error) {
    console.error("Search error:", error);
    return [];
  }

  return data ?? [];
}

export async function addPlayer(formData: FormData) {
  const playerId = Number(formData.get("player_id"));
  const positionTag = formData.get("position_tag") as string;

  if (!playerId || !positionTag) return { error: "Missing fields" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("user_players").insert({
    user_id: user.id,
    player_id: playerId,
    position_tag: positionTag,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "That player or position slot is already filled" };
    }
    console.error("Add player error:", error);
    return { error: "Failed to add player" };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function removePlayer(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("user_players").delete().eq("id", id);

  if (error) {
    console.error("Remove player error:", error);
  }

  revalidatePath("/dashboard");
}

// --- Sleeper league import ---

const POSITION_TAG_ORDER = ["QB", "RB1", "RB2", "WR1", "WR2", "TE", "FLEX"] as const;

export async function importFromSleeper(formData: FormData) {
  const action = formData.get("action") as string;

  if (action === "lookup") {
    const username = formData.get("username") as string;
    if (!username) return { error: "Enter a Sleeper username" };

    const sleeperUser = await lookupSleeperUser(username);
    if (!sleeperUser) return { error: "Sleeper user not found. Check the username and try again." };

    const leagues = await getSleeperLeagues(sleeperUser.user_id);
    if (leagues.length === 0) return { error: "No active NFL leagues found for this user." };

    return { leagues };
  }

  if (action === "import") {
    const username = formData.get("username") as string;
    const leagueId = formData.get("league_id") as string;
    if (!username || !leagueId) return { error: "Missing fields" };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const sleeperUser = await lookupSleeperUser(username);
    if (!sleeperUser) return { error: "Sleeper user not found" };

    const players = await importRosterFromLeague(sleeperUser.user_id, leagueId);
    if (players.length === 0) return { error: "No players found on your roster in this league." };

    // Clear existing roster
    await supabase.from("user_players").delete().eq("user_id", user.id);

    // Match imported players to nfl_players table and assign position tags
    const tagTracker: Record<string, number> = { QB: 0, RB: 0, WR: 0, TE: 0 };
    let imported = 0;

    // Only import starters (up to 7 slots)
    const starters = players.filter((p) => p.isStarter).slice(0, 7);
    // If not enough starters, pad with bench players
    const bench = players.filter((p) => !p.isStarter);
    const toImport = [...starters, ...bench].slice(0, 7);

    for (const p of toImport) {
      // Find the player in nfl_players by name (case-insensitive fuzzy match)
      const { data: matches } = await supabase
        .from("nfl_players")
        .select("id, name, team, position")
        .ilike("name", `%${p.name}%`)
        .limit(5);

      // Pick the best match (exact name + team match preferred)
      const match = matches?.find(
        (m) => m.name.toLowerCase() === p.name.toLowerCase() && m.team === p.team
      ) ?? matches?.find(
        (m) => m.name.toLowerCase() === p.name.toLowerCase()
      ) ?? matches?.[0];

      if (!match) continue;

      // Assign position tag
      let tag: string | null = null;
      const pos = p.position;
      if (pos === "QB" && tagTracker.QB < 1) {
        tag = "QB";
        tagTracker.QB++;
      } else if (pos === "RB" && tagTracker.RB < 2) {
        tagTracker.RB++;
        tag = `RB${tagTracker.RB}`;
      } else if (pos === "WR" && tagTracker.WR < 2) {
        tagTracker.WR++;
        tag = `WR${tagTracker.WR}`;
      } else if (pos === "TE" && tagTracker.TE < 1) {
        tag = "TE";
        tagTracker.TE++;
      } else {
        // Overflow goes to FLEX if available
        const usedTags = POSITION_TAG_ORDER.slice(0, imported);
        if (!usedTags.includes("FLEX" as typeof POSITION_TAG_ORDER[number])) {
          tag = "FLEX";
        }
      }

      if (!tag) continue;

      const { error } = await supabase.from("user_players").insert({
        user_id: user.id,
        player_id: match.id,
        position_tag: tag,
      });

      if (!error) imported++;
    }

    // Also detect and update scoring format from the league
    const leagues = await getSleeperLeagues(sleeperUser.user_id);
    const league = leagues.find((l) => l.league_id === leagueId);
    if (league) {
      await supabase
        .from("profiles")
        .update({ scoring_format: league.scoring_type })
        .eq("id", user.id);
    }

    revalidatePath("/dashboard");
    return {
      message: `Imported ${imported} player${imported !== 1 ? "s" : ""} from Sleeper${league ? ` (${league.scoring_type} scoring detected)` : ""}.`,
    };
  }

  return { error: "Unknown action" };
}

export async function updateScoringFormat(formData: FormData) {
  const format = formData.get("scoring_format") as string;
  if (!["PPR", "Half-PPR", "Standard"].includes(format)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from("profiles")
    .update({ scoring_format: format })
    .eq("id", user.id);

  if (error) {
    console.error("Update scoring format error:", error);
  }

  revalidatePath("/dashboard");
}
