"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAIEnabled, generateAINarratives } from "@/lib/ai";
import type { ReportInput } from "@/lib/ai";
import {
  getNFLState,
  getWeeklyStats,
  calculatePoints,
  formatStatLine,
  type PlayerWeekStats,
} from "@/lib/nfl-stats";
import {
  getWeekScoreboard,
  getNextWeekMatchups,
  getNFLNews,
} from "@/lib/espn";
import { researchPlayers, type ResearchResult } from "@/lib/research";
import {
  isSportsDataEnabled,
  getInjuries,
  getSeasonStats,
  getProjections,
  getGameStats,
  getPlayerNews,
  getGameOdds,
  getStandings,
  getDepthCharts,
  getPlayerProps,
  getDfsSalaries,
} from "@/lib/sportsdata";
import { getAdvancedStats, formatAdvancedStats } from "@/lib/nflverse";
import { isTTSEnabled, buildAudioScript, generateAndStoreAudio } from "@/lib/tts";

// --- NFL team lookup ---

const NFL_TEAMS: Record<string, string> = {
  ARI: "Cardinals", ATL: "Falcons", BAL: "Ravens", BUF: "Bills",
  CAR: "Panthers", CHI: "Bears", CIN: "Bengals", CLE: "Browns",
  DAL: "Cowboys", DEN: "Broncos", DET: "Lions", GB: "Packers",
  HOU: "Texans", IND: "Colts", JAX: "Jaguars", KC: "Chiefs",
  LAC: "Chargers", LAR: "Rams", LV: "Raiders", MIA: "Dolphins",
  MIN: "Vikings", NE: "Patriots", NO: "Saints", NYG: "Giants",
  NYJ: "Jets", PHI: "Eagles", PIT: "Steelers", SEA: "Seahawks",
  SF: "49ers", TB: "Buccaneers", TEN: "Titans", WAS: "Commanders",
};

function teamName(abbrev: string): string {
  return NFL_TEAMS[abbrev] ?? abbrev;
}

// --- Game context — real ESPN data only ---

type GameContext = {
  opponent: string;
  opponentName: string;
  teamScore: number;
  opponentScore: number;
  isHome: boolean;
  spreadFavor: boolean;
  spread: number | null;
  gameTotal: number | null;
  scenario: "shootout" | "blowout_win" | "close_game" | "defensive_battle" | "comeback";
  headline: string | null;
};

/**
 * Build game context from ESPN data. Returns null if no real data available.
 */
function buildGameContext(
  playerTeam: string,
  espnData: Map<string, import("@/lib/espn").TeamGameResult> | null
): GameContext | null {
  const espnGame = espnData?.get(playerTeam);
  if (!espnGame) return null;

  return {
    opponent: espnGame.opponent,
    opponentName: espnGame.opponentName,
    teamScore: espnGame.teamScore,
    opponentScore: espnGame.opponentScore,
    isHome: espnGame.isHome,
    spreadFavor: espnGame.spreadFavor,
    spread: espnGame.spread ?? null,
    gameTotal: espnGame.overUnder ?? null,
    scenario:
      espnGame.gameScenario === "blowout_loss"
        ? ("defensive_battle" as const)
        : (espnGame.gameScenario as GameContext["scenario"]),
    headline: espnGame.headline ?? null,
  };
}

// --- Betting lines — real ESPN data only, no fabrication ---

function buildBettingLines(game: GameContext | null): object[] {
  if (!game) return [];
  const lines: object[] = [];

  // Game spread result (only if real spread data exists)
  if (game.spread != null) {
    const actualMargin = game.teamScore - game.opponentScore;
    const spreadToCheck = game.spreadFavor ? -game.spread : game.spread;
    const covered = actualMargin + spreadToCheck > 0;
    const spreadLabel = game.spreadFavor
      ? `${game.opponentName} +${game.spread}`
      : `${game.opponentName} -${game.spread}`;
    lines.push({ label: spreadLabel, result: covered ? "COVERED" : "MISSED" });
  }

  // Game over/under result (only if real O/U exists)
  if (game.gameTotal != null) {
    const actualTotal = game.teamScore + game.opponentScore;
    lines.push({
      label: `Game O/U ${game.gameTotal}`,
      result: actualTotal > game.gameTotal ? "OVER" : "UNDER",
    });
  }

  return lines;
}

// --- Grade — computed from real points only ---

function generateGrade(totalPoints: number, playerCount: number): string {
  const avg = totalPoints / Math.max(playerCount, 1);
  if (avg >= 20) return "A+";
  if (avg >= 18) return "A";
  if (avg >= 16) return "A-";
  if (avg >= 14) return "B+";
  if (avg >= 12) return "B";
  if (avg >= 10) return "B-";
  if (avg >= 8) return "C+";
  if (avg >= 6) return "C";
  return "C-";
}

// --- Main report generation ---

export async function generateReport() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Fetch user's roster
  const { data: roster } = await supabase
    .from("user_players")
    .select("id, position_tag, player_id, nfl_players(name, team, position)")
    .eq("user_id", user.id)
    .order("created_at");

  if (!roster || roster.length === 0) {
    return { error: "Add at least one player to your roster before generating a report." };
  }

  // Fetch scoring format
  const { data: profile } = await supabase
    .from("profiles")
    .select("scoring_format")
    .eq("id", user.id)
    .single();

  const scoringFormat = profile?.scoring_format ?? "PPR";

  // Get current NFL week
  const nflState = await getNFLState();
  let season: number;
  let weekNumber: number;

  if (nflState && nflState.seasonType === "regular") {
    season = nflState.season;
    weekNumber = Math.max(1, nflState.week - 1);
  } else {
    const now = new Date();
    season = now.getFullYear();
    const seasonStart = new Date(season, 8, 5);
    weekNumber = Math.max(
      1,
      Math.min(
        18,
        Math.ceil(
          (now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
        )
      )
    );
  }

  // Check if report already exists for this week
  const { data: existing } = await supabase
    .from("reports")
    .select("id")
    .eq("user_id", user.id)
    .eq("week_number", weekNumber)
    .eq("season", season)
    .single();

  if (existing) {
    return {
      error: `You already have a report for Week ${weekNumber}. View it in your report history.`,
      reportId: existing.id,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rosterPlayers = (roster as any[]).map((r) => ({
    player_id: r.player_id as number,
    position_tag: r.position_tag as string,
    nfl_players: r.nfl_players as { name: string; team: string; position: string },
  }));

  // ===================================================================
  // PHASE 1: Gather real data from all sources in parallel
  // ===================================================================

  const nextWeek = Math.min(weekNumber + 1, 18);
  const sdEnabled = isSportsDataEnabled();

  const [
    realStats,
    espnScoreboard,
    nextWeekMatchups,
    espnNews,
    sdInjuries,
    sdSeasonStats,
    sdProjections,
    sdGameStats,
    sdNews,
    sdOdds,
    sdStandings,
    sdDepthCharts,
    sdPlayerProps,
    sdDfsSalaries,
    advancedStats,
  ] = await Promise.all([
    // Sleeper
    getWeeklyStats(
      rosterPlayers.map((r) => r.nfl_players),
      season,
      weekNumber
    ),
    // ESPN
    getWeekScoreboard(season, weekNumber),
    getNextWeekMatchups(season, nextWeek),
    getNFLNews(10),
    // SportsDataIO — Player & Stats
    sdEnabled ? getInjuries(season, weekNumber) : Promise.resolve(null),
    sdEnabled ? getSeasonStats(season) : Promise.resolve(null),
    sdEnabled
      ? getProjections(season, nextWeek, scoringFormat)
      : Promise.resolve(null),
    sdEnabled ? getGameStats(season, weekNumber) : Promise.resolve(null),
    sdEnabled ? getPlayerNews(20) : Promise.resolve(null),
    // SportsDataIO — Betting & Context
    sdEnabled ? getGameOdds(season, weekNumber) : Promise.resolve(null),
    sdEnabled ? getStandings(season) : Promise.resolve(null),
    sdEnabled ? getDepthCharts() : Promise.resolve(null),
    sdEnabled ? getPlayerProps(season, weekNumber) : Promise.resolve(null),
    sdEnabled ? getDfsSalaries(season, weekNumber) : Promise.resolve(null),
    // nflverse — Advanced analytics (EPA, air yards, YAC, target share)
    getAdvancedStats(season, weekNumber),
  ]);

  const hasSleeperStats = realStats !== null && realStats.size > 0;
  const hasESPNData = espnScoreboard !== null && espnScoreboard.size > 0;
  const hasSportsData = sdGameStats !== null || sdInjuries !== null;
  const hasBettingData = sdOdds !== null || sdPlayerProps !== null;
  const hasAdvancedStats = advancedStats !== null && advancedStats.size > 0;

  // We need at least one structured data source to generate a meaningful report
  if (!hasSleeperStats && !hasESPNData && !hasSportsData) {
    return {
      error: `No game data available for Week ${weekNumber} of the ${season} season. Reports can only be generated after games have been played and stats have been published.`,
    };
  }

  // ===================================================================
  // PHASE 2: Web research via Claude (runs in parallel with processing)
  // ===================================================================

  // Combine ESPN and SportsDataIO news headlines for research context
  const combinedHeadlines: { headline: string; description: string }[] = [];
  if (espnNews) combinedHeadlines.push(...espnNews);
  if (sdNews) {
    for (const n of sdNews) {
      combinedHeadlines.push({ headline: n.title, description: n.content });
    }
  }

  const researchPromise = isAIEnabled()
    ? researchPlayers(
        rosterPlayers.map((r) => r.nfl_players),
        weekNumber,
        season,
        combinedHeadlines.length > 0 ? combinedHeadlines : undefined
      )
    : Promise.resolve(null);

  // ===================================================================
  // PHASE 3: Build player data from real sources only
  // ===================================================================

  const playerData = rosterPlayers.map((r) => {
    const { name, team, position } = r.nfl_players;

    // Game context — real ESPN data or null
    const game = buildGameContext(team, espnScoreboard);

    // Next week matchup — real ESPN data or null
    const realNext = nextWeekMatchups?.get(team);

    // Stats — real Sleeper data or null
    const real = realStats?.get(name) as PlayerWeekStats | undefined;
    let points: number | null = null;
    let statsLine: string | null = null;
    let keyNumber: number | null = null;

    if (real) {
      points = calculatePoints(real, position, scoringFormat);
      statsLine = formatStatLine(real, position);
      keyNumber =
        position === "QB"
          ? real.passYds
          : position === "RB"
            ? real.rushYds
            : real.recYds;
    }

    // SportsDataIO enrichment — player stats & injuries
    const injury = sdInjuries?.get(name) ?? null;
    const seasonStats = sdSeasonStats?.get(name) ?? null;
    const projection = sdProjections?.get(name) ?? null;
    const gameStats = sdGameStats?.get(name) ?? null;
    const depthChart = sdDepthCharts?.get(name) ?? null;
    const dfsSalary = sdDfsSalaries?.get(name) ?? null;
    const playerProps = sdPlayerProps?.get(name) ?? null;

    // Betting context — game odds for this player's team
    const teamOdds = sdOdds?.get(team) ?? null;

    // Team standing
    const teamStanding = sdStandings?.get(team) ?? null;
    const oppStanding = game?.opponent ? sdStandings?.get(game.opponent) ?? null : null;

    // Season average from SportsDataIO (real data)
    let seasonAvg: number | null = null;
    if (seasonStats) {
      seasonAvg =
        scoringFormat === "PPR"
          ? seasonStats.avgPPR
          : scoringFormat === "Half-PPR"
            ? seasonStats.avgHalfPPR
            : seasonStats.avgStandard;
    }

    // Position rank from SportsDataIO game stats (real data)
    let positionRank: string | null = null;
    if (gameStats?.positionRankPPR) {
      positionRank = `${position}${gameStats.positionRankPPR}`;
    }

    // Snap count info
    let snapCount: string | null = null;
    if (gameStats?.snapCounts) {
      snapCount = gameStats.snapPercent
        ? `${gameStats.snapCounts} snaps (${gameStats.snapPercent}%)`
        : `${gameStats.snapCounts} snaps`;
    }

    // Injury status string
    let injuryStatus: string | null = null;
    if (injury) {
      const parts = [injury.status];
      if (injury.bodyPart && injury.bodyPart !== "Unknown") {
        parts.push(`(${injury.bodyPart})`);
      }
      if (injury.practice && injury.practice !== "Unknown") {
        parts.push(`— ${injury.practice}`);
      }
      injuryStatus = parts.join(" ");
    }

    // Depth chart position
    let depthPosition: string | null = null;
    if (depthChart) {
      const label = depthChart.depthOrder === 1 ? "Starter" :
        depthChart.depthOrder === 2 ? "Backup" : `${depthChart.depthOrder}rd string`;
      depthPosition = `${label} ${depthChart.position}`;
    }

    // Team record string
    let teamRecord: string | null = null;
    if (teamStanding) {
      const tiesStr = teamStanding.ties > 0 ? `-${teamStanding.ties}` : "";
      teamRecord = `${teamStanding.wins}-${teamStanding.losses}${tiesStr}`;
      if (teamStanding.streak) {
        teamRecord += ` (${teamStanding.streak})`;
      }
      if (teamStanding.playoffStatus !== "In Hunt") {
        teamRecord += ` — ${teamStanding.playoffStatus}`;
      }
    }

    // Opponent record string
    let oppRecord: string | null = null;
    if (oppStanding) {
      const tiesStr = oppStanding.ties > 0 ? `-${oppStanding.ties}` : "";
      oppRecord = `${oppStanding.wins}-${oppStanding.losses}${tiesStr}`;
    }

    // DFS salary string
    let dfsSalaryStr: string | null = null;
    if (dfsSalary) {
      const parts: string[] = [];
      if (dfsSalary.draftKingsSalary) parts.push(`DK $${dfsSalary.draftKingsSalary}`);
      if (dfsSalary.fanDuelSalary) parts.push(`FD $${dfsSalary.fanDuelSalary}`);
      if (parts.length > 0) dfsSalaryStr = parts.join(" / ");
    }

    // Player props string
    let playerPropsStr: string | null = null;
    if (playerProps && playerProps.length > 0) {
      playerPropsStr = playerProps
        .slice(0, 4)
        .map((p) => `${p.propType} O/U ${p.overUnder}`)
        .join(", ");
    }

    // Betting line details for this game (from SportsDataIO, supplements ESPN)
    let bettingDetails: string | null = null;
    if (teamOdds) {
      const parts: string[] = [];
      const isHome = teamOdds.homeTeam === team;
      const spread = isHome ? teamOdds.homeSpread : teamOdds.awaySpread;
      if (spread != null) {
        parts.push(`Spread: ${spread > 0 ? "+" : ""}${spread}`);
      }
      if (teamOdds.overUnder != null) {
        parts.push(`O/U: ${teamOdds.overUnder}`);
      }
      if (teamOdds.impliedTotal) {
        const it = isHome ? teamOdds.impliedTotal.home : teamOdds.impliedTotal.away;
        parts.push(`Implied team total: ${it}`);
      }
      const ml = isHome ? teamOdds.homeMoneyLine : teamOdds.awayMoneyLine;
      if (ml != null) {
        parts.push(`ML: ${ml > 0 ? "+" : ""}${ml}`);
      }
      if (parts.length > 0) bettingDetails = parts.join(" | ");
    }

    // nflverse advanced stats (EPA, air yards, YAC, target share)
    const advanced = advancedStats?.get(name) ?? null;
    const advancedStatsStr = advanced ? formatAdvancedStats(advanced) : null;

    // Next-week projection
    let projectedPointsNextWeek: number | null = null;
    let projectedStatsNextWeek: string | null = null;
    if (projection) {
      projectedPointsNextWeek = projection.projectedPoints;
      const projParts: string[] = [];
      if (position === "QB") {
        if (projection.projectedPassYds)
          projParts.push(`${projection.projectedPassYds} pass yds`);
        if (projection.projectedPassTd)
          projParts.push(`${projection.projectedPassTd} TD`);
        if (projection.projectedRushYds)
          projParts.push(`${projection.projectedRushYds} rush yds`);
      } else if (position === "RB") {
        if (projection.projectedRushYds)
          projParts.push(`${projection.projectedRushYds} rush yds`);
        if (projection.projectedRushTd)
          projParts.push(`${projection.projectedRushTd} rush TD`);
        if (projection.projectedRec)
          projParts.push(`${projection.projectedRec} rec`);
      } else {
        if (projection.projectedRec)
          projParts.push(`${projection.projectedRec} rec`);
        if (projection.projectedRecYds)
          projParts.push(`${projection.projectedRecYds} rec yds`);
        if (projection.projectedRecTd)
          projParts.push(`${projection.projectedRecTd} TD`);
      }
      if (projParts.length > 0) {
        projectedStatsNextWeek = `Proj: ${projParts.join(", ")}`;
      }
    }

    return {
      player_id: r.player_id,
      position_tag: r.position_tag,
      name,
      team,
      position,
      points,
      statsLine,
      keyNumber,
      game,
      nextOpponent: realNext?.opponent ?? null,
      nextOpponentName: realNext?.opponentName ?? null,
      // SportsDataIO enrichment — player data
      seasonAvg,
      positionRank,
      snapCount,
      injuryStatus,
      depthPosition,
      projectedPointsNextWeek,
      projectedStatsNextWeek,
      // SportsDataIO enrichment — context
      teamRecord,
      oppRecord,
      bettingDetails,
      playerPropsStr,
      dfsSalaryStr,
      // nflverse advanced analytics
      advancedStatsStr,
    };
  });

  // Compute totals from real data only
  const playersWithStats = playerData.filter((p) => p.points !== null);
  const totalPoints =
    playersWithStats.length > 0
      ? Math.round(
          playersWithStats.reduce((sum, p) => sum + p.points!, 0) * 10
        ) / 10
      : null;
  const grade =
    totalPoints !== null && playersWithStats.length > 0
      ? generateGrade(totalPoints, playersWithStats.length)
      : null;

  // Wait for research to complete
  const research: ResearchResult | null = await researchPromise;
  const hasResearch =
    research !== null && Object.keys(research.players ?? {}).length > 0;

  // ===================================================================
  // PHASE 4: Generate narratives via AI (no template fallbacks)
  // ===================================================================

  let weekNarrative: string | null = null;
  let leagueContext: object[] = [];
  let bottomLine: string | null = null;
  let startSit: { player: string; verdict: string; reason: string }[] = [];
  const playerNarrativeMap: Record<
    string,
    { narrative: string; outlook: string; keyInsight: string; tags: string[] }
  > = {};

  if (isAIEnabled()) {
    const aiInput: ReportInput = {
      weekNumber,
      season,
      scoringFormat,
      totalPoints: totalPoints ?? 0,
      grade: grade ?? "N/A",
      hasRealStats: hasSleeperStats,
      hasRealGameData: hasESPNData,
      hasWebResearch: hasResearch,
      hasSportsDataIO: hasSportsData,
      hasBettingData,
      hasAdvancedStats,
      leagueNews: research?.leagueNews,
      players: playerData.map((p) => {
        const gameScore = p.game
          ? `${teamName(p.team)} ${p.game.teamScore}, ${p.game.opponentName} ${p.game.opponentScore}`
          : undefined;

        return {
          name: p.name,
          team: p.team,
          teamName: teamName(p.team),
          position: p.position,
          statsLine: p.statsLine ?? "Stats not available for this week",
          points: p.points ?? 0,
          seasonAvg: p.seasonAvg ?? 0,
          positionRank: p.positionRank ?? "N/A",
          opponent: p.game?.opponent ?? "Unknown",
          opponentName: p.game?.opponentName ?? "Unknown",
          gameScenario: p.game?.scenario ?? "unknown",
          spread: p.game?.spread ?? 0,
          spreadFavor: p.game?.spreadFavor ?? false,
          gameTotal: p.game?.gameTotal ?? 0,
          nextOpponent: p.nextOpponent ?? "Unknown",
          nextOpponentName: p.nextOpponentName ?? "Unknown",
          nextMatchupFavorable: false,
          // Real game data (ESPN)
          gameScore,
          gameHeadline: p.game?.headline,
          // SportsDataIO enrichment — player data
          injuryStatus: p.injuryStatus,
          snapCount: p.snapCount,
          depthPosition: p.depthPosition,
          projectedPointsNextWeek: p.projectedPointsNextWeek,
          projectedStatsNextWeek: p.projectedStatsNextWeek,
          // SportsDataIO enrichment — team & betting context
          teamRecord: p.teamRecord,
          oppRecord: p.oppRecord,
          bettingDetails: p.bettingDetails,
          playerProps: p.playerPropsStr,
          dfsSalary: p.dfsSalaryStr,
          // nflverse advanced analytics
          advancedStats: p.advancedStatsStr,
          // Web research
          research: research?.players?.[p.name],
        };
      }),
    };

    const aiResult = await generateAINarratives(aiInput);

    if (aiResult) {
      weekNarrative = aiResult.weekNarrative;
      leagueContext = aiResult.leagueContext;
      bottomLine = aiResult.bottomLine;
      startSit = aiResult.startSit ?? [];
      for (const [name, narr] of Object.entries(aiResult.playerNarratives)) {
        playerNarrativeMap[name] = narr;
      }
    }
  }

  // ===================================================================
  // PHASE 5: Assemble and save report — no fabricated data
  // ===================================================================

  const noAIMessage = !isAIEnabled()
    ? "AI-powered narrative analysis is not configured. Set the ANTHROPIC_API_KEY environment variable to enable intelligent report narratives."
    : "AI narrative generation was unsuccessful for this report. Please try again.";

  const playerBreakdowns = playerData.map((p) => {
    const aiNarr = playerNarrativeMap[p.name];
    // Pack betting lines, key insight, and tags into the JSONB column
    const bettingAndInsights = {
      lines: buildBettingLines(p.game),
      keyInsight: aiNarr?.keyInsight ?? null,
      tags: aiNarr?.tags ?? [],
    };
    return {
      player_id: p.player_id,
      position_tag: p.position_tag,
      points: p.points,
      season_avg: p.seasonAvg, // Real data from SportsDataIO, or null
      position_rank: p.positionRank, // Real data from SportsDataIO, or null
      stats_line: p.statsLine,
      betting_lines: bettingAndInsights,
      narrative: aiNarr?.narrative ?? (p.points !== null ? null : "No statistics were available for this player this week."),
      outlook: aiNarr?.outlook ?? null,
    };
  });

  const sorted = [...playerData]
    .filter((p) => p.points !== null)
    .sort((a, b) => b.points! - a.points!);
  const summary = sorted.length > 0
    ? `${totalPoints} pts — ${sorted[0].name} led with ${sorted[0].points}`
    : "No player statistics available for this week";

  // Insert report
  const { data: report, error: reportError } = await supabase
    .from("reports")
    .insert({
      user_id: user.id,
      week_number: weekNumber,
      season,
      scoring_format: scoringFormat,
      title: `Week ${weekNumber} Report`,
      total_points: totalPoints,
      grade,
      summary,
      week_narrative: weekNarrative ?? noAIMessage,
      league_context: leagueContext.length > 0 ? leagueContext : null,
      bottom_line: bottomLine,
      start_sit: startSit.length > 0 ? startSit : null,
      status: "generated",
    })
    .select("id")
    .single();

  if (reportError) {
    console.error("Report insert error:", reportError);
    return { error: "Failed to generate report. Please try again." };
  }

  // Insert player breakdowns
  const { error: playersError } = await supabase
    .from("report_players")
    .insert(
      playerBreakdowns.map((p) => ({
        report_id: report.id,
        player_id: p.player_id,
        position_tag: p.position_tag,
        points: p.points,
        season_avg: p.season_avg,
        position_rank: p.position_rank,
        stats_line: p.stats_line,
        betting_lines: p.betting_lines,
        narrative: p.narrative,
        outlook: p.outlook,
      }))
    );

  if (playersError) {
    console.error("Report players insert error:", playersError);
  }

  // ===================================================================
  // PHASE 6: Generate TTS audio (non-blocking — runs after save)
  // ===================================================================

  if (isTTSEnabled() && weekNarrative) {
    // Fire and forget — don't block the user from seeing their report
    const audioScript = buildAudioScript({
      title: `Week ${weekNumber} Report`,
      grade,
      week_narrative: weekNarrative,
      bottom_line: bottomLine,
      players: playerBreakdowns.map((p) => ({
        name: playerData.find((pd) => pd.player_id === p.player_id)?.name ?? "",
        narrative: p.narrative,
        outlook: p.outlook,
      })),
    });

    generateAndStoreAudio(audioScript, report.id).then(async (audioUrl) => {
      if (audioUrl) {
        await supabase
          .from("reports")
          .update({ audio_url: audioUrl })
          .eq("id", report.id);
      }
    });
  }

  revalidatePath("/dashboard");
  return { success: true, reportId: report.id };
}
