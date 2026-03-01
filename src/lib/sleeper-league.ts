/**
 * Sleeper league integration — import a user's roster from their Sleeper league.
 *
 * Endpoints:
 *   GET /v1/user/{username}                          — look up user
 *   GET /v1/user/{user_id}/leagues/nfl/{season}      — get leagues
 *   GET /v1/league/{league_id}/rosters               — get rosters
 *   GET /v1/league/{league_id}/users                 — get league members
 *   GET /v1/players/nfl                              — player ID → name mapping
 *
 * No auth required.
 */

const BASE = "https://api.sleeper.app/v1";
const TIMEOUT = 8000;

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT),
      next: { revalidate: 300 }, // 5 min cache
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// --- Types ---

type SleeperUser = {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string | null;
};

type SleeperLeague = {
  league_id: string;
  name: string;
  season: string;
  total_rosters: number;
  scoring_settings: Record<string, number>;
  status: string; // "in_season", "complete", "drafting"
};

type SleeperRoster = {
  roster_id: number;
  owner_id: string;
  players: string[] | null; // sleeper player IDs
  starters: string[] | null;
};

type SleeperPlayer = {
  player_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  team: string | null;
  position: string | null;
  active: boolean;
};

// --- Public types ---

export type LeagueInfo = {
  league_id: string;
  name: string;
  season: string;
  total_rosters: number;
  scoring_type: string; // "PPR", "Half-PPR", "Standard"
};

export type ImportedPlayer = {
  name: string;
  team: string;
  position: string;
  isStarter: boolean;
};

// --- Player cache (the full player list is ~10MB, cache it) ---

let playerCache: Map<string, SleeperPlayer> | null = null;
let playerCacheTime = 0;
const PLAYER_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function getPlayerMap(): Promise<Map<string, SleeperPlayer>> {
  if (playerCache && Date.now() - playerCacheTime < PLAYER_CACHE_TTL) {
    return playerCache;
  }

  const data = await fetchJSON<Record<string, SleeperPlayer>>(
    `${BASE}/players/nfl`
  );
  if (!data) return playerCache ?? new Map();

  playerCache = new Map(Object.entries(data));
  playerCacheTime = Date.now();
  return playerCache;
}

// --- Team normalization ---

const TEAM_NORMALIZE: Record<string, string> = {
  JAC: "JAX",
  LA: "LAR",
};

function normalizeTeam(team: string | null): string {
  if (!team) return "FA";
  return TEAM_NORMALIZE[team] ?? team;
}

// --- Scoring detection ---

function detectScoringFormat(settings: Record<string, number>): string {
  const recPts = settings?.rec ?? 0;
  if (recPts >= 1) return "PPR";
  if (recPts >= 0.5) return "Half-PPR";
  return "Standard";
}

// --- Public API ---

export async function lookupSleeperUser(
  username: string
): Promise<SleeperUser | null> {
  return fetchJSON<SleeperUser>(`${BASE}/user/${encodeURIComponent(username)}`);
}

export async function getSleeperLeagues(
  userId: string,
  season?: number
): Promise<LeagueInfo[]> {
  const s = season ?? new Date().getFullYear();
  const leagues = await fetchJSON<SleeperLeague[]>(
    `${BASE}/user/${userId}/leagues/nfl/${s}`
  );
  if (!leagues) return [];

  return leagues
    .filter((l) => l.status !== "drafting")
    .map((l) => ({
      league_id: l.league_id,
      name: l.name,
      season: l.season,
      total_rosters: l.total_rosters,
      scoring_type: detectScoringFormat(l.scoring_settings),
    }));
}

export async function importRosterFromLeague(
  sleeperUserId: string,
  leagueId: string
): Promise<ImportedPlayer[]> {
  const [rosters, playerMap] = await Promise.all([
    fetchJSON<SleeperRoster[]>(`${BASE}/league/${leagueId}/rosters`),
    getPlayerMap(),
  ]);

  if (!rosters || playerMap.size === 0) return [];

  // Find the user's roster
  const userRoster = rosters.find((r) => r.owner_id === sleeperUserId);
  if (!userRoster) return [];

  const starterIds = new Set(userRoster.starters ?? []);
  const playerIds = userRoster.players ?? [];

  const players: ImportedPlayer[] = [];

  for (const pid of playerIds) {
    const p = playerMap.get(pid);
    if (!p) continue;
    // Only import fantasy-relevant positions
    if (!p.position || !["QB", "RB", "WR", "TE"].includes(p.position))
      continue;

    players.push({
      name: p.full_name,
      team: normalizeTeam(p.team),
      position: p.position,
      isStarter: starterIds.has(pid),
    });
  }

  // Sort: starters first, then by position order
  const posOrder: Record<string, number> = { QB: 0, RB: 1, WR: 2, TE: 3 };
  players.sort((a, b) => {
    if (a.isStarter !== b.isStarter) return a.isStarter ? -1 : 1;
    return (posOrder[a.position] ?? 9) - (posOrder[b.position] ?? 9);
  });

  return players;
}
