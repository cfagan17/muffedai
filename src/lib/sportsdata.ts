/**
 * SportsDataIO NFL API integration.
 *
 * Provides comprehensive NFL data across multiple feed categories:
 *
 * PLAYER FEEDS:
 *   - Injuries with body part, status, and practice participation
 *   - Depth chart positioning (starter, backup, 3rd string)
 *   - Snap counts and advanced usage data
 *
 * STATS & SCORES:
 *   - Season stats for computing real season averages
 *   - Game scores with final results
 *   - Schedule with TV channels and game times
 *
 * FANTASY FEEDS:
 *   - Fantasy projections for upcoming weeks
 *   - DFS salaries (DraftKings, FanDuel)
 *
 * BETTING FEEDS:
 *   - Pre-game betting lines (spreads, O/U, moneylines)
 *   - Player prop bets (passing yards, rushing yards, TDs, etc.)
 *
 * STANDINGS:
 *   - Team records, division rankings, playoff positioning
 *
 * NEWS:
 *   - Player news blurbs (tagged by category from RotoBaller)
 *
 * Requires SPORTSDATA_API_KEY environment variable.
 * Free trial available at https://sportsdata.io/cart/free-trial/nfl
 *
 * Authentication: Ocp-Apim-Subscription-Key header
 * Falls back to null when the API key is missing or API is unreachable.
 */

// --- Types ---

export type PlayerInjury = {
  name: string;
  team: string;
  position: string;
  bodyPart: string;
  status: string; // Out, Doubtful, Questionable, Probable
  practice: string; // Full Participation, Limited Participation, Did Not Participate
  declaredInactive: boolean;
};

export type PlayerSeasonAvg = {
  name: string;
  team: string;
  gamesPlayed: number;
  fantasyPointsPPR: number;
  fantasyPointsHalfPPR: number;
  fantasyPointsStandard: number;
  avgPPR: number;
  avgHalfPPR: number;
  avgStandard: number;
};

export type PlayerProjection = {
  name: string;
  team: string;
  position: string;
  projectedPoints: number; // in the user's scoring format
  projectedPassYds: number;
  projectedPassTd: number;
  projectedRushYds: number;
  projectedRushTd: number;
  projectedRec: number;
  projectedRecYds: number;
  projectedRecTd: number;
};

export type PlayerGameStats = {
  name: string;
  team: string;
  position: string;
  snapCounts: number | null;
  snapPercent: number | null;
  fantasyPointsPPR: number;
  fantasyPointsHalfPPR: number;
  fantasyPointsStandard: number;
  positionRankPPR: number | null;
};

export type PlayerNewsItem = {
  title: string;
  content: string;
  source: string;
  updated: string;
  categories: string; // e.g., "Injury, Top Headlines"
  playerName: string | null;
  team: string | null;
};

export type GameOdds = {
  gameKey: string;
  homeTeam: string;
  awayTeam: string;
  homeSpread: number | null;
  awaySpread: number | null;
  overUnder: number | null;
  homeMoneyLine: number | null;
  awayMoneyLine: number | null;
  homeScore: number | null;
  awayScore: number | null;
  // Derived for easy lookup by team
  impliedTotal: { home: number; away: number } | null;
};

export type TeamStanding = {
  team: string;
  conference: string;
  division: string;
  wins: number;
  losses: number;
  ties: number;
  divisionRank: number;
  conferenceRank: number;
  pointsFor: number;
  pointsAgainst: number;
  streak: string; // e.g., "W3", "L1"
  playoffStatus: string; // e.g., "Clinched Division", "In Hunt", "Eliminated"
};

export type DepthChartEntry = {
  name: string;
  team: string;
  position: string;
  depthOrder: number; // 1 = starter, 2 = backup, 3+ = reserve
  positionCategory: string; // Offense, Defense, Special Teams
};

export type GameScore = {
  gameKey: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  quarter: string | null; // "Final", "Q4", etc.
  stadium: string | null;
  channel: string | null; // TV channel
  isOver: boolean;
};

export type PlayerProp = {
  name: string;
  team: string;
  propType: string; // "Passing Yards", "Rushing Yards", "Receiving Yards", "Touchdowns"
  overUnder: number;
  overPayout: number;
  underPayout: number;
  description: string;
};

export type DfsSalary = {
  name: string;
  team: string;
  position: string;
  draftKingsSalary: number | null;
  fanDuelSalary: number | null;
};

// --- API helpers ---

const API_BASE = "https://api.sportsdata.io/v3/nfl";
const FETCH_TIMEOUT = 12_000;

const apiKey = process.env.SPORTSDATA_API_KEY;

export function isSportsDataEnabled(): boolean {
  return !!apiKey;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

async function fetchSD<T>(path: string): Promise<T | null> {
  if (!apiKey) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(`${API_BASE}${path}`, {
      signal: controller.signal,
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
        Accept: "application/json",
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.error(
        `SportsDataIO API error: ${response.status} for ${path}`
      );
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`SportsDataIO fetch failed for ${path}:`, error);
    return null;
  }
}

// --- Team abbreviation normalization ---

const SD_TEAM_MAP: Record<string, string> = {
  JAC: "JAX",
  LA: "LAR",
  WSH: "WAS",
};

function normalizeTeam(team: string | null): string {
  if (!team) return "";
  return SD_TEAM_MAP[team] ?? team;
}

// --- Public API ---

/**
 * Fetch injury reports for a given season and week.
 * Returns a map of player name → injury info.
 */
export async function getInjuries(
  season: number,
  week: number
): Promise<Map<string, PlayerInjury> | null> {
  const data = await fetchSD<any[]>(`/scores/json/Injuries/${season}/${week}`);
  if (!data) return null;

  const injuries = new Map<string, PlayerInjury>();

  for (const item of data) {
    if (!item.Name || !item.Status) continue;
    injuries.set(item.Name, {
      name: item.Name,
      team: normalizeTeam(item.Team),
      position: item.Position ?? "",
      bodyPart: item.BodyPart ?? "Unknown",
      status: item.Status ?? "Unknown",
      practice:
        item.Practice ?? item.PracticeDescription ?? "Unknown",
      declaredInactive: item.DeclaredInactive ?? false,
    });
  }

  return injuries.size > 0 ? injuries : null;
}

/**
 * Fetch season stats for computing real averages.
 * Returns a map of player name → season averages.
 */
export async function getSeasonStats(
  season: number
): Promise<Map<string, PlayerSeasonAvg> | null> {
  const data = await fetchSD<any[]>(
    `/stats/json/PlayerSeasonStats/${season}`
  );
  if (!data) return null;

  const stats = new Map<string, PlayerSeasonAvg>();

  for (const item of data) {
    if (!item.Name || !item.Played || item.Played === 0) continue;
    const gp = item.Played;
    const fpPPR = item.FantasyPointsPPR ?? 0;
    const fpHalf = item.FantasyPointsHalfPPR ?? item.FantasyPointsPPR ?? 0;
    const fpStd = item.FantasyPoints ?? 0;

    stats.set(item.Name, {
      name: item.Name,
      team: normalizeTeam(item.Team),
      gamesPlayed: gp,
      fantasyPointsPPR: fpPPR,
      fantasyPointsHalfPPR: fpHalf,
      fantasyPointsStandard: fpStd,
      avgPPR: Math.round((fpPPR / gp) * 10) / 10,
      avgHalfPPR: Math.round((fpHalf / gp) * 10) / 10,
      avgStandard: Math.round((fpStd / gp) * 10) / 10,
    });
  }

  return stats.size > 0 ? stats : null;
}

/**
 * Fetch weekly fantasy projections for the specified week.
 * Returns a map of player name → projection.
 */
export async function getProjections(
  season: number,
  week: number,
  scoringFormat: string
): Promise<Map<string, PlayerProjection> | null> {
  const data = await fetchSD<any[]>(
    `/projections/json/PlayerGameProjectionStatsByWeek/${season}/${week}`
  );
  if (!data) return null;

  const projections = new Map<string, PlayerProjection>();

  for (const item of data) {
    if (!item.Name) continue;

    const projectedPoints =
      scoringFormat === "PPR"
        ? item.FantasyPointsPPR ?? 0
        : scoringFormat === "Half-PPR"
          ? item.FantasyPointsHalfPPR ?? item.FantasyPointsPPR ?? 0
          : item.FantasyPoints ?? 0;

    // Skip players with 0 projected points (not playing)
    if (projectedPoints === 0) continue;

    projections.set(item.Name, {
      name: item.Name,
      team: normalizeTeam(item.Team),
      position: item.Position ?? "",
      projectedPoints: Math.round(projectedPoints * 10) / 10,
      projectedPassYds: item.PassingYards ?? 0,
      projectedPassTd: item.PassingTouchdowns ?? 0,
      projectedRushYds: item.RushingYards ?? 0,
      projectedRushTd: item.RushingTouchdowns ?? 0,
      projectedRec: item.Receptions ?? 0,
      projectedRecYds: item.ReceivingYards ?? 0,
      projectedRecTd: item.ReceivingTouchdowns ?? 0,
    });
  }

  return projections.size > 0 ? projections : null;
}

/**
 * Fetch player game stats with snap counts and fantasy rankings.
 * Returns a map of player name → game stats.
 */
export async function getGameStats(
  season: number,
  week: number
): Promise<Map<string, PlayerGameStats> | null> {
  const data = await fetchSD<any[]>(
    `/stats/json/PlayerGameStatsByWeek/${season}/${week}`
  );
  if (!data) return null;

  // Sort by PPR points to compute position ranks
  const byPosition: Record<string, any[]> = {};
  for (const item of data) {
    if (!item.Name || !item.Position) continue;
    const pos = item.Position;
    if (!byPosition[pos]) byPosition[pos] = [];
    byPosition[pos].push(item);
  }

  // Assign ranks within each position
  const posRanks = new Map<string, number>();
  for (const [, players] of Object.entries(byPosition)) {
    players.sort(
      (a: any, b: any) =>
        (b.FantasyPointsPPR ?? 0) - (a.FantasyPointsPPR ?? 0)
    );
    players.forEach((p: any, i: number) => {
      posRanks.set(p.Name, i + 1);
    });
  }

  const stats = new Map<string, PlayerGameStats>();

  for (const item of data) {
    if (!item.Name) continue;
    // Only include players who actually played
    if (!item.Played && (item.FantasyPointsPPR ?? 0) === 0) continue;

    stats.set(item.Name, {
      name: item.Name,
      team: normalizeTeam(item.Team),
      position: item.Position ?? "",
      snapCounts: item.SnapCounts ?? item.OffensiveSnapsPlayed ?? null,
      snapPercent:
        item.OffensiveSnapsPlayed != null &&
        item.OffensiveTeamSnaps != null &&
        item.OffensiveTeamSnaps > 0
          ? Math.round(
              (item.OffensiveSnapsPlayed / item.OffensiveTeamSnaps) * 100
            )
          : null,
      fantasyPointsPPR: item.FantasyPointsPPR ?? 0,
      fantasyPointsHalfPPR: item.FantasyPointsHalfPPR ?? 0,
      fantasyPointsStandard: item.FantasyPoints ?? 0,
      positionRankPPR: posRanks.get(item.Name) ?? null,
    });
  }

  return stats.size > 0 ? stats : null;
}

/**
 * Fetch latest player news.
 * Returns an array of news items sorted by most recent.
 */
export async function getPlayerNews(
  limit = 20
): Promise<PlayerNewsItem[] | null> {
  const data = await fetchSD<any[]>("/scores/json/News");
  if (!data) return null;

  return data
    .slice(0, limit)
    .map((item: any) => ({
      title: item.Title ?? "",
      content: item.Content ?? "",
      source: item.Source ?? "",
      updated: item.Updated ?? item.TimeAgo ?? "",
      categories: item.Categories ?? "",
      playerName: item.PlayerID ? (item.Title?.split(":")[0] ?? null) : null,
      team: normalizeTeam(item.Team),
    }));
}

/**
 * Fetch betting lines (spreads, over/unders, moneylines) for a given week.
 * Returns a map of team abbreviation → odds for that team's game.
 */
export async function getGameOdds(
  season: number,
  week: number
): Promise<Map<string, GameOdds> | null> {
  const data = await fetchSD<any[]>(
    `/scores/json/ScoresByWeek/${season}/${week}`
  );
  if (!data) return null;

  const odds = new Map<string, GameOdds>();

  for (const game of data) {
    const home = normalizeTeam(game.HomeTeam);
    const away = normalizeTeam(game.AwayTeam);
    const ou = game.OverUnder ?? null;

    // Compute implied team totals from spread + O/U
    let impliedTotal: { home: number; away: number } | null = null;
    if (ou != null && game.PointSpread != null) {
      const homeSpread = game.PointSpread;
      impliedTotal = {
        home: Math.round(((ou - homeSpread) / 2) * 10) / 10,
        away: Math.round(((ou + homeSpread) / 2) * 10) / 10,
      };
    }

    const entry: GameOdds = {
      gameKey: game.GameKey ?? `${away}@${home}`,
      homeTeam: home,
      awayTeam: away,
      homeSpread: game.PointSpread ?? null,
      awaySpread: game.PointSpread != null ? -game.PointSpread : null,
      overUnder: ou,
      homeMoneyLine: game.HomeTeamMoneyLine ?? null,
      awayMoneyLine: game.AwayTeamMoneyLine ?? null,
      homeScore: game.HomeScore ?? null,
      awayScore: game.AwayScore ?? null,
      impliedTotal,
    };

    // Index by both teams for easy lookup
    odds.set(home, entry);
    odds.set(away, entry);
  }

  return odds.size > 0 ? odds : null;
}

/**
 * Fetch NFL standings with division/conference rankings.
 * Returns a map of team abbreviation → standing info.
 */
export async function getStandings(
  season: number
): Promise<Map<string, TeamStanding> | null> {
  const data = await fetchSD<any[]>(`/scores/json/Standings/${season}`);
  if (!data) return null;

  const standings = new Map<string, TeamStanding>();

  for (const item of data) {
    const team = normalizeTeam(item.Team);
    if (!team) continue;

    const wins = item.Wins ?? 0;
    const losses = item.Losses ?? 0;

    // Derive playoff status
    let playoffStatus = "In Hunt";
    if (item.DivisionRank === 1) {
      playoffStatus = wins >= 10 ? "Clinched Division" : "Division Leader";
    } else if (item.ConferenceRank != null && item.ConferenceRank <= 7) {
      playoffStatus = "Playoff Position";
    } else if (losses >= 12) {
      playoffStatus = "Eliminated";
    }

    // Derive streak from recent games
    let streak = "";
    if (item.Streak != null) {
      streak = `${item.Streak > 0 ? "W" : "L"}${Math.abs(item.Streak)}`;
    } else if (item.StreakDescription) {
      streak = item.StreakDescription;
    }

    standings.set(team, {
      team,
      conference: item.Conference ?? "",
      division: item.Division ?? "",
      wins,
      losses,
      ties: item.Ties ?? 0,
      divisionRank: item.DivisionRank ?? 0,
      conferenceRank: item.ConferenceRank ?? 0,
      pointsFor: item.PointsFor ?? 0,
      pointsAgainst: item.PointsAgainst ?? 0,
      streak,
      playoffStatus,
    });
  }

  return standings.size > 0 ? standings : null;
}

/**
 * Fetch depth charts for all teams.
 * Returns a map of player name → depth chart position.
 */
export async function getDepthCharts(): Promise<Map<string, DepthChartEntry> | null> {
  const data = await fetchSD<any[]>("/scores/json/DepthCharts");
  if (!data) return null;

  const charts = new Map<string, DepthChartEntry>();

  // The response is nested: array of teams, each with a DepthChart array
  for (const teamData of data) {
    const team = normalizeTeam(teamData.Team);
    const depthChart = teamData.DepthChart ?? teamData.Players ?? [];

    if (Array.isArray(depthChart)) {
      for (const entry of depthChart) {
        if (!entry.Name) continue;
        charts.set(entry.Name, {
          name: entry.Name,
          team,
          position: entry.Position ?? "",
          depthOrder: entry.DepthOrder ?? entry.Depth ?? 1,
          positionCategory: entry.PositionCategory ?? "Offense",
        });
      }
    }
  }

  return charts.size > 0 ? charts : null;
}

/**
 * Fetch game scores for a specific week.
 * Returns a map of team abbreviation → game score info.
 */
export async function getScoresByWeek(
  season: number,
  week: number
): Promise<Map<string, GameScore> | null> {
  const data = await fetchSD<any[]>(
    `/scores/json/ScoresByWeek/${season}/${week}`
  );
  if (!data) return null;

  const scores = new Map<string, GameScore>();

  for (const game of data) {
    const home = normalizeTeam(game.HomeTeam);
    const away = normalizeTeam(game.AwayTeam);

    const entry: GameScore = {
      gameKey: game.GameKey ?? `${away}@${home}`,
      homeTeam: home,
      awayTeam: away,
      homeScore: game.HomeScore ?? 0,
      awayScore: game.AwayScore ?? 0,
      quarter: game.Quarter ?? (game.IsOver ? "Final" : null),
      stadium: game.StadiumDetails?.Name ?? game.Stadium ?? null,
      channel: game.Channel ?? null,
      isOver: game.IsOver ?? false,
    };

    scores.set(home, entry);
    scores.set(away, entry);
  }

  return scores.size > 0 ? scores : null;
}

/**
 * Fetch player prop bets for a given week.
 * Returns a map of player name → array of props (a player may have multiple).
 */
export async function getPlayerProps(
  season: number,
  week: number
): Promise<Map<string, PlayerProp[]> | null> {
  const data = await fetchSD<any[]>(
    `/odds/json/PlayerPropsByWeek/${season}/${week}`
  );
  if (!data) return null;

  const props = new Map<string, PlayerProp[]>();

  for (const item of data) {
    const name = item.Name ?? item.PlayerName;
    if (!name) continue;

    const prop: PlayerProp = {
      name,
      team: normalizeTeam(item.Team),
      propType: item.BetType ?? item.Category ?? "Unknown",
      overUnder: item.OverUnder ?? item.Line ?? 0,
      overPayout: item.OverPayout ?? 0,
      underPayout: item.UnderPayout ?? 0,
      description: item.Description ?? `${item.BetType ?? ""} O/U ${item.OverUnder ?? item.Line ?? "?"}`,
    };

    const existing = props.get(name) ?? [];
    existing.push(prop);
    props.set(name, existing);
  }

  return props.size > 0 ? props : null;
}

/**
 * Fetch DFS salaries for a given week.
 * Returns a map of player name → salary info.
 */
export async function getDfsSalaries(
  season: number,
  week: number
): Promise<Map<string, DfsSalary> | null> {
  const data = await fetchSD<any[]>(
    `/projections/json/DfsSalaries/${season}/${week}`
  );
  if (!data) return null;

  const salaries = new Map<string, DfsSalary>();

  for (const item of data) {
    if (!item.Name) continue;

    // Build from DraftKings and FanDuel salary fields
    const dk = item.DraftKingsSalary ?? null;
    const fd = item.FanDuelSalary ?? null;
    if (dk === null && fd === null) continue;

    salaries.set(item.Name, {
      name: item.Name,
      team: normalizeTeam(item.Team),
      position: item.Position ?? "",
      draftKingsSalary: dk,
      fanDuelSalary: fd,
    });
  }

  return salaries.size > 0 ? salaries : null;
}
