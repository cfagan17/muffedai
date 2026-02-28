"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
