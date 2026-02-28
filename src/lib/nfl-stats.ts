/**
 * NFL stats integration via the Sleeper API (free, no auth required).
 *
 * Endpoints used:
 *   GET https://api.sleeper.app/v1/state/nfl           — current season/week
 *   GET https://api.sleeper.app/v1/players/nfl          — full player list (cache heavily)
 *   GET https://api.sleeper.app/stats/nfl/{season}/{week}?season_type=regular
 *       — weekly stats for all players
 *   GET https://api.sleeper.app/projections/nfl/{season}/{week}?season_type=regular
 *       — weekly projections for all players
 *
 * Falls back to null when the API is unreachable so callers can use mock data.
 */

// --- Types ---

export type NFLState = {
  season: number;
  week: number;
  seasonType: string; // "regular", "post", "pre", "off"
};

export type PlayerWeekStats = {
  passYds: number;
  passTd: number;
  passInt: number;
  rushAtt: number;
  rushYds: number;
  rushTd: number;
  rec: number;
  recTgt: number;
  recYds: number;
  recTd: number;
  fumblesLost: number;
};

export type PlayerMatchup = {
  opponent: string; // team abbreviation
  isHome: boolean;
};

// --- Sleeper response types ---

type SleeperState = {
  season: string;
  week: number;
  season_type: string;
  display_week: number;
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

type SleeperWeekStats = Record<string, Record<string, number>>;

// --- Team abbreviation normalization ---
// Sleeper uses slightly different abbreviations for some teams

const TEAM_NORMALIZE: Record<string, string> = {
  JAC: "JAX",
  LA: "LAR",
};

function normalizeTeam(team: string): string {
  return TEAM_NORMALIZE[team] ?? team;
}

// --- API helpers ---

const SLEEPER_BASE = "https://api.sleeper.app";
const FETCH_TIMEOUT = 8000; // 8 seconds

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "Accept": "application/json" },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`Sleeper API error: ${response.status} for ${url}`);
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`Sleeper API fetch failed for ${url}:`, error);
    return null;
  }
}

// --- Player ID cache ---
// The full player list is ~10MB and rarely changes, so we cache it in memory.

let playerCache: Map<string, SleeperPlayer> | null = null;
let playerCacheTime = 0;
const PLAYER_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function getSleeperPlayers(): Promise<Map<string, SleeperPlayer> | null> {
  if (playerCache && Date.now() - playerCacheTime < PLAYER_CACHE_TTL) {
    return playerCache;
  }

  const data = await fetchJSON<Record<string, SleeperPlayer>>(
    `${SLEEPER_BASE}/v1/players/nfl`
  );
  if (!data) return null;

  playerCache = new Map(Object.entries(data));
  playerCacheTime = Date.now();
  return playerCache;
}

// --- Public API ---

/**
 * Get the current NFL season state (week, season, type).
 */
export async function getNFLState(): Promise<NFLState | null> {
  const state = await fetchJSON<SleeperState>(`${SLEEPER_BASE}/v1/state/nfl`);
  if (!state) return null;

  return {
    season: parseInt(state.season),
    week: state.display_week ?? state.week,
    seasonType: state.season_type,
  };
}

/**
 * Find a Sleeper player ID by name and team.
 * Uses fuzzy matching: exact name match preferred, falls back to last-name + team.
 */
export async function findSleeperPlayerId(
  name: string,
  team: string
): Promise<string | null> {
  const players = await getSleeperPlayers();
  if (!players) return null;

  const normalizedTeam = normalizeTeam(team);
  const nameLower = name.toLowerCase();

  // Pass 1: exact full name + team match
  for (const [id, player] of players) {
    if (
      player.full_name?.toLowerCase() === nameLower &&
      player.team &&
      normalizeTeam(player.team) === normalizedTeam
    ) {
      return id;
    }
  }

  // Pass 2: last name + team + position match
  const lastName = name.split(" ").pop()?.toLowerCase() ?? "";
  for (const [id, player] of players) {
    if (
      player.last_name?.toLowerCase() === lastName &&
      player.team &&
      normalizeTeam(player.team) === normalizedTeam &&
      player.active
    ) {
      return id;
    }
  }

  return null;
}

/**
 * Fetch weekly stats for a list of players.
 * Returns a map of player name -> stats, or null if the API is unreachable.
 */
export async function getWeeklyStats(
  players: { name: string; team: string; position: string }[],
  season: number,
  week: number
): Promise<Map<string, PlayerWeekStats> | null> {
  // Fetch all weekly stats
  const allStats = await fetchJSON<SleeperWeekStats>(
    `${SLEEPER_BASE}/stats/nfl/${season}/${week}?season_type=regular`
  );
  if (!allStats) return null;

  // Resolve Sleeper IDs for each player
  const result = new Map<string, PlayerWeekStats>();

  for (const player of players) {
    const sleeperId = await findSleeperPlayerId(player.name, player.team);
    if (!sleeperId || !allStats[sleeperId]) continue;

    const raw = allStats[sleeperId];
    result.set(player.name, {
      passYds: raw.pass_yd ?? 0,
      passTd: raw.pass_td ?? 0,
      passInt: raw.pass_int ?? 0,
      rushAtt: raw.rush_att ?? 0,
      rushYds: raw.rush_yd ?? 0,
      rushTd: raw.rush_td ?? 0,
      rec: raw.rec ?? 0,
      recTgt: raw.rec_tgt ?? 0,
      recYds: raw.rec_yd ?? 0,
      recTd: raw.rec_td ?? 0,
      fumblesLost: raw.fum_lost ?? 0,
    });
  }

  return result.size > 0 ? result : null;
}

/**
 * Calculate fantasy points from raw stats.
 */
export function calculatePoints(
  stats: PlayerWeekStats,
  position: string,
  scoringFormat: string
): number {
  let pts = 0;

  // Passing
  pts += stats.passYds * 0.04;
  pts += stats.passTd * 4;
  pts -= stats.passInt * 2;

  // Rushing
  pts += stats.rushYds * 0.1;
  pts += stats.rushTd * 6;

  // Receiving
  pts += stats.recYds * 0.1;
  pts += stats.recTd * 6;
  if (scoringFormat === "PPR") {
    pts += stats.rec;
  } else if (scoringFormat === "Half-PPR") {
    pts += stats.rec * 0.5;
  }

  // Fumbles
  pts -= stats.fumblesLost * 2;

  return Math.round(pts * 10) / 10;
}

/**
 * Format a stat line for display.
 */
export function formatStatLine(stats: PlayerWeekStats, position: string): string {
  if (position === "QB") {
    const parts = [
      `${stats.passYds} yds`,
      `${stats.passTd} TD`,
      `${stats.passInt} INT`,
      `${stats.rushYds} rush yds`,
    ];
    if (stats.rushTd > 0) parts.push(`${stats.rushTd} rush TD`);
    return parts.join(" / ");
  }

  if (position === "RB") {
    const parts = [
      `${stats.rushAtt} car`,
      `${stats.rushYds} yds`,
      `${stats.rushTd} TD`,
      `${stats.rec} rec`,
      `${stats.recYds} rec yds`,
    ];
    if (stats.recTd > 0) parts.push(`${stats.recTd} rec TD`);
    return parts.join(" / ");
  }

  // WR and TE
  return `${stats.rec} rec / ${stats.recTgt} tgt / ${stats.recYds} yds / ${stats.recTd} TD`;
}
