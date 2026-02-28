/**
 * ESPN public API integration for real NFL game data.
 *
 * Endpoints used (no authentication required):
 *   GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard
 *       ?week={week}&seasontype=2&season={season}
 *       — Weekly scoreboard with game results, scores, odds, and headlines
 *
 *   GET https://site.api.espn.com/apis/site/v2/sports/football/nfl/news
 *       ?limit={n}
 *       — Latest NFL news headlines
 *
 * Falls back to null when the API is unreachable so callers can use mock data.
 */

// --- Types ---

export type TeamGameResult = {
  opponent: string; // team abbreviation
  opponentName: string;
  isHome: boolean;
  teamScore: number;
  opponentScore: number;
  won: boolean;
  pointDiff: number;
  headline?: string;
  spread?: number;
  spreadFavor: boolean; // true if this team was favored
  overUnder?: number;
  actualTotal: number;
  gameScenario:
    | "shootout"
    | "blowout_win"
    | "blowout_loss"
    | "close_game"
    | "defensive_battle"
    | "comeback";
};

export type NFLNewsItem = {
  headline: string;
  description: string;
};

// --- API helpers ---

const ESPN_BASE =
  "https://site.api.espn.com/apis/site/v2/sports/football/nfl";
const FETCH_TIMEOUT = 10_000;

async function fetchESPN<T>(url: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`ESPN API error: ${response.status} for ${url}`);
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`ESPN API fetch failed for ${url}:`, error);
    return null;
  }
}

// --- Team abbreviation normalization ---
// ESPN occasionally uses different abbreviations than our internal format.

const ESPN_TEAM_MAP: Record<string, string> = {
  WSH: "WAS",
  JAC: "JAX",
};

function normalizeTeam(abbrev: string): string {
  return ESPN_TEAM_MAP[abbrev] ?? abbrev;
}

// --- Game scenario classification ---

function classifyScenario(
  won: boolean,
  pointDiff: number,
  totalPoints: number
): TeamGameResult["gameScenario"] {
  if (totalPoints >= 55) return "shootout";
  if (totalPoints <= 30) return "defensive_battle";
  if (won && pointDiff >= 14) return "blowout_win";
  if (!won && pointDiff >= 14) return "blowout_loss";
  // Close loss where team was behind most of the game → comeback narrative
  if (!won && pointDiff <= 3) return "comeback";
  if (pointDiff <= 7) return "close_game";
  return won ? "blowout_win" : "close_game";
}

// --- ESPN response types (simplified) ---

/* eslint-disable @typescript-eslint/no-explicit-any */

// --- Public API ---

/**
 * Fetch the weekly scoreboard with real game results.
 * Returns a Map of team abbreviation → game result for that team.
 */
export async function getWeekScoreboard(
  season: number,
  week: number
): Promise<Map<string, TeamGameResult> | null> {
  const data = await fetchESPN<any>(
    `${ESPN_BASE}/scoreboard?week=${week}&seasontype=2&season=${season}`
  );
  if (!data?.events) return null;

  const teamResults = new Map<string, TeamGameResult>();

  for (const event of data.events) {
    const competition = event.competitions?.[0];
    if (!competition) continue;

    const competitors = competition.competitors;
    if (!competitors || competitors.length !== 2) continue;

    const home = competitors.find((c: any) => c.homeAway === "home");
    const away = competitors.find((c: any) => c.homeAway === "away");
    if (!home || !away) continue;

    const homeTeam = normalizeTeam(home.team.abbreviation);
    const awayTeam = normalizeTeam(away.team.abbreviation);
    const homeScore = parseInt(home.score) || 0;
    const awayScore = parseInt(away.score) || 0;
    const completed = competition.status?.type?.completed ?? false;

    // Skip games that haven't finished
    if (!completed) continue;

    const headline: string | undefined =
      competition.headlines?.[0]?.shortLinkText;

    // Extract odds if available
    const odds = competition.odds?.[0];
    const overUnder: number | undefined = odds?.overUnder;
    let spread: number | undefined;
    let spreadFavorite: string | undefined;
    if (odds?.details) {
      const match = odds.details.match(/^(\w+)\s+(-[\d.]+)$/);
      if (match) {
        spreadFavorite = normalizeTeam(match[1]);
        spread = Math.abs(parseFloat(match[2]));
      }
    }

    const actualTotal = homeScore + awayScore;
    const pointDiff = Math.abs(homeScore - awayScore);
    const homeWon = homeScore > awayScore;

    // Home team entry
    teamResults.set(homeTeam, {
      opponent: awayTeam,
      opponentName: away.team.displayName ?? awayTeam,
      isHome: true,
      teamScore: homeScore,
      opponentScore: awayScore,
      won: homeWon,
      pointDiff: homeWon ? pointDiff : -pointDiff,
      headline,
      spread,
      spreadFavor: spreadFavorite === homeTeam,
      overUnder,
      actualTotal,
      gameScenario: classifyScenario(homeWon, pointDiff, actualTotal),
    });

    // Away team entry
    teamResults.set(awayTeam, {
      opponent: homeTeam,
      opponentName: home.team.displayName ?? homeTeam,
      isHome: false,
      teamScore: awayScore,
      opponentScore: homeScore,
      won: !homeWon,
      pointDiff: homeWon ? -pointDiff : pointDiff,
      headline,
      spread,
      spreadFavor: spreadFavorite === awayTeam,
      overUnder,
      actualTotal,
      gameScenario: classifyScenario(!homeWon, pointDiff, actualTotal),
    });
  }

  return teamResults.size > 0 ? teamResults : null;
}

/**
 * Fetch next week's scoreboard for upcoming matchups.
 * Returns a Map of team abbreviation → opponent abbreviation.
 */
export async function getNextWeekMatchups(
  season: number,
  week: number
): Promise<Map<string, { opponent: string; opponentName: string }> | null> {
  const data = await fetchESPN<any>(
    `${ESPN_BASE}/scoreboard?week=${week}&seasontype=2&season=${season}`
  );
  if (!data?.events) return null;

  const matchups = new Map<
    string,
    { opponent: string; opponentName: string }
  >();

  for (const event of data.events) {
    const competition = event.competitions?.[0];
    if (!competition) continue;

    const competitors = competition.competitors;
    if (!competitors || competitors.length !== 2) continue;

    const home = competitors.find((c: any) => c.homeAway === "home");
    const away = competitors.find((c: any) => c.homeAway === "away");
    if (!home || !away) continue;

    const homeTeam = normalizeTeam(home.team.abbreviation);
    const awayTeam = normalizeTeam(away.team.abbreviation);

    matchups.set(homeTeam, {
      opponent: awayTeam,
      opponentName: away.team.displayName ?? awayTeam,
    });
    matchups.set(awayTeam, {
      opponent: homeTeam,
      opponentName: home.team.displayName ?? homeTeam,
    });
  }

  return matchups.size > 0 ? matchups : null;
}

/**
 * Fetch current NFL news headlines.
 */
export async function getNFLNews(
  limit = 10
): Promise<NFLNewsItem[] | null> {
  const data = await fetchESPN<any>(`${ESPN_BASE}/news?limit=${limit}`);
  if (!data?.articles) return null;

  return data.articles.map((article: any) => ({
    headline: article.headline ?? "",
    description: article.description ?? "",
  }));
}
