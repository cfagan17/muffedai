/**
 * nflverse advanced analytics integration.
 *
 * Fetches pre-computed weekly player stats from nflverse's open-source
 * GitHub releases. These include EPA, air yards, YAC, target share,
 * WOPR, and other advanced metrics derived from play-by-play data.
 *
 * Data source: https://github.com/nflverse/nflverse-data/releases/tag/player_stats
 * Updated nightly during the NFL season.
 *
 * No API key required — fully open-source data.
 */

// --- Types ---

export type AdvancedPlayerStats = {
  name: string;
  team: string;
  position: string;
  week: number;
  // EPA (Expected Points Added)
  passingEPA: number | null;
  rushingEPA: number | null;
  receivingEPA: number | null;
  // Air yards
  passingAirYards: number | null;
  receivingAirYards: number | null;
  // Yards after catch
  receivingYAC: number | null;
  // Usage & efficiency rates
  targetShare: number | null; // share of team targets (0-1)
  airYardsShare: number | null; // share of team air yards (0-1)
  wopr: number | null; // Weighted Opportunity Rating
  racr: number | null; // Receiver Air Conversion Ratio
  pacr: number | null; // Passing Air Conversion Ratio
  // Composite
  dakota: number | null; // adjusted EPA + CPOE composite
};

// --- CSV parsing ---

const FETCH_TIMEOUT = 20_000;
const DATA_URL_BASE =
  "https://github.com/nflverse/nflverse-data/releases/download/player_stats";

function parseCSVRow(header: string[], row: string): Record<string, string> {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  values.push(current.trim());

  const record: Record<string, string> = {};
  for (let i = 0; i < header.length && i < values.length; i++) {
    record[header[i]] = values[i];
  }
  return record;
}

function toNum(val: string | undefined): number | null {
  if (!val || val === "" || val === "NA" || val === "NaN") return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : Math.round(n * 1000) / 1000;
}

// --- Public API ---

/**
 * Fetch advanced player stats for a given season and week from nflverse.
 * Returns a map of player display name → advanced stats.
 */
export async function getAdvancedStats(
  season: number,
  week: number
): Promise<Map<string, AdvancedPlayerStats> | null> {
  const url = `${DATA_URL_BASE}/player_stats_${season}.csv`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "text/csv" },
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`nflverse fetch failed: ${response.status} for ${url}`);
      return null;
    }

    const text = await response.text();
    const lines = text.split("\n").filter((l) => l.trim() !== "");
    if (lines.length < 2) return null;

    const header = lines[0].split(",").map((h) => h.trim());
    const stats = new Map<string, AdvancedPlayerStats>();

    // Column indices we need
    const col = (name: string) => header.indexOf(name);
    const weekIdx = col("week");
    const seasonTypeIdx = col("season_type");
    const nameIdx = col("player_display_name");

    if (weekIdx === -1 || nameIdx === -1) {
      console.error("nflverse CSV missing expected columns");
      return null;
    }

    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVRow(header, lines[i]);

      // Filter to the requested week and regular season
      if (row.week !== String(week)) continue;
      if (row.season_type && row.season_type !== "REG") continue;

      const name = row.player_display_name;
      if (!name) continue;

      const position = row.position ?? "";
      // Only include fantasy-relevant positions
      if (!["QB", "RB", "WR", "TE"].includes(position)) continue;

      stats.set(name, {
        name,
        team: row.recent_team ?? "",
        position,
        week,
        // EPA
        passingEPA: toNum(row.passing_epa),
        rushingEPA: toNum(row.rushing_epa),
        receivingEPA: toNum(row.receiving_epa),
        // Air yards
        passingAirYards: toNum(row.passing_air_yards),
        receivingAirYards: toNum(row.receiving_air_yards),
        // YAC
        receivingYAC: toNum(row.receiving_yards_after_catch),
        // Usage & efficiency
        targetShare: toNum(row.target_share),
        airYardsShare: toNum(row.air_yards_share),
        wopr: toNum(row.wopr),
        racr: toNum(row.racr),
        pacr: toNum(row.pacr),
        // Composite
        dakota: toNum(row.dakota),
      });
    }

    return stats.size > 0 ? stats : null;
  } catch (error) {
    console.error("nflverse advanced stats fetch failed:", error);
    return null;
  }
}

/**
 * Format advanced stats into a concise string for the AI prompt.
 */
export function formatAdvancedStats(
  stats: AdvancedPlayerStats
): string | null {
  const parts: string[] = [];

  // EPA — the headline advanced stat
  if (stats.position === "QB") {
    if (stats.passingEPA != null) {
      parts.push(`Passing EPA: ${stats.passingEPA > 0 ? "+" : ""}${stats.passingEPA}`);
    }
    if (stats.rushingEPA != null && stats.rushingEPA !== 0) {
      parts.push(`Rushing EPA: ${stats.rushingEPA > 0 ? "+" : ""}${stats.rushingEPA}`);
    }
    if (stats.dakota != null) {
      parts.push(`Dakota (EPA+CPOE): ${stats.dakota > 0 ? "+" : ""}${stats.dakota}`);
    }
    if (stats.pacr != null) {
      parts.push(`PACR: ${stats.pacr}`);
    }
    if (stats.passingAirYards != null) {
      parts.push(`Air yards: ${stats.passingAirYards}`);
    }
  } else {
    // RB, WR, TE
    if (stats.receivingEPA != null) {
      parts.push(`Receiving EPA: ${stats.receivingEPA > 0 ? "+" : ""}${stats.receivingEPA}`);
    }
    if (stats.rushingEPA != null && stats.rushingEPA !== 0) {
      parts.push(`Rushing EPA: ${stats.rushingEPA > 0 ? "+" : ""}${stats.rushingEPA}`);
    }
    if (stats.targetShare != null) {
      parts.push(`Target share: ${Math.round(stats.targetShare * 100)}%`);
    }
    if (stats.airYardsShare != null) {
      parts.push(`Air yards share: ${Math.round(stats.airYardsShare * 100)}%`);
    }
    if (stats.wopr != null) {
      parts.push(`WOPR: ${stats.wopr}`);
    }
    if (stats.receivingAirYards != null) {
      parts.push(`Air yards: ${stats.receivingAirYards}`);
    }
    if (stats.receivingYAC != null) {
      parts.push(`YAC: ${stats.receivingYAC}`);
    }
    if (stats.racr != null) {
      parts.push(`RACR: ${stats.racr}`);
    }
  }

  return parts.length > 0 ? parts.join(" | ") : null;
}
