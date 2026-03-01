import Anthropic from "@anthropic-ai/sdk";
import type { PlayerResearch, LeagueNewsItem } from "./research";

const apiKey = process.env.ANTHROPIC_API_KEY;

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (!apiKey) return null;
  if (!client) {
    client = new Anthropic({ apiKey });
  }
  return client;
}

export function isAIEnabled(): boolean {
  return !!apiKey;
}

// --- Types ---

type PlayerInput = {
  name: string;
  team: string;
  teamName: string;
  position: string;
  statsLine: string;
  points: number;
  seasonAvg: number;
  positionRank: string;
  opponent: string;
  opponentName: string;
  gameScenario: string;
  spread: number;
  spreadFavor: boolean;
  gameTotal: number;
  nextOpponent: string;
  nextOpponentName: string;
  nextMatchupFavorable: boolean;
  // Real game data (from ESPN)
  gameScore?: string | null;
  gameHeadline?: string | null;
  // SportsDataIO enrichment — player data
  injuryStatus?: string | null; // e.g., "Questionable (Knee) — Limited Practice"
  snapCount?: string | null; // e.g., "58 snaps (89%)"
  depthPosition?: string | null; // e.g., "Starter WR", "Backup RB"
  projectedPointsNextWeek?: number | null;
  projectedStatsNextWeek?: string | null; // e.g., "Proj: 275 pass yds, 2 TD"
  // SportsDataIO enrichment — team & betting context
  teamRecord?: string | null; // e.g., "10-4 (W3) — Clinched Division"
  oppRecord?: string | null; // e.g., "7-7"
  bettingDetails?: string | null; // e.g., "Spread: -3.5 | O/U: 47.5 | Implied team total: 25.5 | ML: -180"
  playerProps?: string | null; // e.g., "Passing Yards O/U 275.5, Touchdowns O/U 1.5"
  dfsSalary?: string | null; // e.g., "DK $8200 / FD $9000"
  // nflverse advanced analytics
  advancedStats?: string | null; // e.g., "Passing EPA: +12.3 | Dakota: +0.067 | Air yards: 164"
  // Web research context (from Claude web search)
  research?: PlayerResearch;
};

type ReportInput = {
  weekNumber: number;
  season: number;
  scoringFormat: string;
  totalPoints: number;
  grade: string;
  players: PlayerInput[];
  // Enriched context
  leagueNews?: LeagueNewsItem[];
  hasRealStats: boolean;
  hasRealGameData: boolean;
  hasWebResearch: boolean;
  hasSportsDataIO: boolean;
  hasBettingData: boolean;
  hasAdvancedStats: boolean;
};

type PlayerNarrative = {
  narrative: string;
  outlook: string;
  keyInsight: string; // 1-sentence data-driven takeaway (e.g., EPA vs box score disconnect)
  tags: string[]; // 2-4 short labels like "EPA Leader", "Target Hog", "Buy Low", "Sell High"
};

type StartSitRec = {
  player: string;
  verdict: "START" | "SIT" | "FLEX";
  reason: string;
};

type ReportNarratives = {
  weekNarrative: string;
  playerNarratives: Record<string, PlayerNarrative>; // keyed by player name
  leagueContext: { title: string; body: string }[];
  bottomLine: string;
  startSit: StartSitRec[];
};

export type { PlayerInput, ReportInput, ReportNarratives, PlayerNarrative, StartSitRec };

// --- Prompt construction ---

function buildPlayerSummary(p: PlayerInput, scoringFormat: string): string {
  const matchupType = p.gameScenario.replace(/_/g, " ");
  const favorLine = p.spreadFavor
    ? `${p.teamName} favored by ${p.spread}`
    : `${p.opponentName} favored by ${p.spread}`;

  const lines = [
    `- ${p.name} (${p.position}, ${p.teamName})`,
    `  Stats: ${p.statsLine} | ${p.points} pts (${scoringFormat} avg: ${p.seasonAvg}, rank: ${p.positionRank})`,
    `  vs ${p.opponentName} | Game type: ${matchupType} | Line: ${favorLine}, O/U ${p.gameTotal}`,
  ];

  // Real game score from ESPN
  if (p.gameScore) {
    lines.push(`  Final score: ${p.gameScore}`);
  }
  if (p.gameHeadline) {
    lines.push(`  Game headline: ${p.gameHeadline}`);
  }

  // SportsDataIO player data
  if (p.depthPosition) {
    lines.push(`  Depth chart: ${p.depthPosition}`);
  }
  if (p.snapCount) {
    lines.push(`  Snap count: ${p.snapCount}`);
  }
  if (p.injuryStatus) {
    lines.push(`  Injury: ${p.injuryStatus}`);
  }

  // Team context
  if (p.teamRecord) {
    lines.push(`  Team record: ${p.teamRecord}`);
  }
  if (p.oppRecord) {
    lines.push(`  Opponent record: ${p.oppRecord}`);
  }

  // Betting data
  if (p.bettingDetails) {
    lines.push(`  Betting lines: ${p.bettingDetails}`);
  }
  if (p.playerProps) {
    lines.push(`  Player props: ${p.playerProps}`);
  }

  // DFS salary
  if (p.dfsSalary) {
    lines.push(`  DFS salary: ${p.dfsSalary}`);
  }

  // Advanced analytics (nflverse — EPA, air yards, YAC, target share)
  if (p.advancedStats) {
    lines.push(`  Advanced: ${p.advancedStats}`);
  }

  // Next week outlook
  if (p.nextOpponentName && p.nextOpponentName !== "Unknown") {
    const projPart = p.projectedPointsNextWeek
      ? ` | Projected: ${p.projectedPointsNextWeek} pts`
      : "";
    const projStats = p.projectedStatsNextWeek
      ? ` (${p.projectedStatsNextWeek})`
      : "";
    lines.push(`  Next week: vs ${p.nextOpponentName}${projPart}${projStats}`);
  } else if (p.projectedPointsNextWeek) {
    lines.push(
      `  Next week projection: ${p.projectedPointsNextWeek} pts`
    );
  }

  // Web research context
  if (p.research) {
    lines.push(`  --- WEB RESEARCH ---`);
    if (p.research.gameRecap) {
      lines.push(`  Game recap: ${p.research.gameRecap}`);
    }
    if (p.research.quotes && p.research.quotes !== "No quotes found") {
      lines.push(`  Quotes: ${p.research.quotes}`);
    }
    if (
      p.research.injuryStatus &&
      !p.research.injuryStatus.toLowerCase().includes("healthy")
    ) {
      lines.push(`  Injury: ${p.research.injuryStatus}`);
    }
    if (p.research.expertAnalysis) {
      lines.push(`  Expert analysis: ${p.research.expertAnalysis}`);
    }
    if (p.research.storylines && p.research.storylines !== "None") {
      lines.push(`  Storylines: ${p.research.storylines}`);
    }
  }

  return lines.join("\n");
}

function buildPrompt(input: ReportInput): string {
  const playerSummaries = input.players
    .sort((a, b) => b.points - a.points)
    .map((p) => buildPlayerSummary(p, input.scoringFormat))
    .join("\n\n");

  // Data source context — tells the AI what kind of data it's working with
  const dataSources: string[] = [];
  if (input.hasRealStats) dataSources.push("real NFL statistics from Sleeper");
  if (input.hasRealGameData)
    dataSources.push("real game scores and matchups from ESPN");
  if (input.hasSportsDataIO)
    dataSources.push(
      "SportsDataIO (injuries, snap counts, depth charts, season averages, projections, team standings)"
    );
  if (input.hasBettingData)
    dataSources.push(
      "betting data (game spreads, over/unders, moneylines, implied team totals, player prop bets, DFS salaries)"
    );
  if (input.hasAdvancedStats)
    dataSources.push(
      "nflverse advanced analytics (EPA, CPOE, air yards, yards after catch, target share, WOPR, RACR/PACR)"
    );
  if (input.hasWebResearch)
    dataSources.push(
      "web research including game recaps, press conferences, and expert analysis"
    );
  const dataContext = dataSources.length > 0
    ? `Data sources for this report: ${dataSources.join(", ")}.`
    : "Limited data available for this report — write only about what is confirmed.";

  // League news context from web research
  let leagueNewsSection = "";
  if (input.leagueNews && input.leagueNews.length > 0) {
    leagueNewsSection = `\n\nRECENT NFL NEWS (from web research — use these to inform the "leagueContext" section):\n${input.leagueNews
      .map((n) => `- ${n.headline}: ${n.summary}`)
      .join("\n")}`;
  }

  return `You are the lead analyst for Muffed, a premium fantasy football report that reads like The Ringer meets ESPN Fantasy Focus. Write the narrative sections for a Week ${input.weekNumber} report (${input.season} season, ${input.scoringFormat} scoring).

${dataContext}

The user's roster scored ${input.totalPoints} total points — graded as a ${input.grade} week.

ROSTER:
${playerSummaries}${leagueNewsSection}

Write the following sections as JSON. This report is designed to be read aloud as a ~2 minute audio briefing. Every sentence must earn its place — no filler, no generic observations. You have a wealth of data; your job is to DISTILL it down to the sharpest insights only.

VOICE & STYLE:
- Confident, conversational, opinionated — you're a trusted fantasy advisor giving a quick briefing
- Lead with the insight, back it with the data point. Not: "He had 73 yards." But: "Gibbs' +4.2 rushing EPA says the 73 yards undersell how dominant he was."
- Be specific: real scores, real stat lines, real prop lines, real EPA numbers
- Cross-reference players who share the same game when relevant

DATA PRIORITY — you have a lot of data, so here's how to pick what makes the cut:
- Advanced analytics (EPA, CPOE, target share, WOPR, YAC) are your sharpest tools. Use them to reveal what the box score hides — a player who was better or worse than their stat line suggests. This is the #1 differentiator.
- Betting context (props, spreads, O/U) adds color when it tells a story: "cleared his 72.5 rushing prop" or "game went 14 points over the total, inflating everyone's numbers."
- Snap counts and depth chart status matter when there's a trend or surprise — don't mention them if the player is an established starter with normal usage.
- Web research quotes and game moments add texture when vivid — use the best one per player, not all of them.
- Injury status is ALWAYS worth mentioning if a player is hurt. Skip it only if they're fully healthy.
- Next-week projections belong in the outlook — compare to season average to set expectations.

Return ONLY valid JSON with this exact structure:
{
  "weekNarrative": "ONE paragraph, 3-5 sentences. Open with the week's headline (grade, total points, the story of the week). Hit the 1-2 most interesting analytics insights across the roster — where did the advanced numbers diverge from the box score? Close with one sentence on the overall roster trajectory or a key trend.",
  "playerNarratives": {
    "PLAYER_NAME": {
      "narrative": "2-4 sentences. Lead with the key stat line and score context. Then deliver the ONE most important insight from the data — the thing that tells you whether this performance is real or misleading. Use EPA, target share, snap counts, prop results, or game script as evidence. Don't rehash the stat line — interpret it.",
      "outlook": "1-2 sentences about next week. Name the opponent, reference the projection vs season average, flag any injury concern, and give a clear expectation.",
      "keyInsight": "One sharp, data-driven sentence. The single most important takeaway. Example: 'A 42% carry share with +4.2 rushing EPA — he's not splitting this backfield, he's winning it.'",
      "tags": ["2-4 short labels. Choose from: 'EPA Elite', 'EPA Concern', 'Volume King', 'Target Hog', 'Efficiency Monster', 'Boom Game', 'Bust Alert', 'Buy Low', 'Sell High', 'Workload Watch', 'Injury Risk', 'Breakout', 'TD Dependent', 'Garbage Time', 'Matchup Proof', 'Game Script Winner', 'Snap Count Alert', 'Prop Crusher', 'Under the Radar'"]
    }
  },
  "leagueContext": [
    { "title": "Headline (under 8 words)", "body": "2-3 sentences. One NFL story that matters for fantasy this week. Be specific about the implication." }
  ],
  "startSit": [
    { "player": "PLAYER_NAME", "verdict": "START or SIT or FLEX", "reason": "1 sentence. Why — reference projection, matchup, usage trend, or injury. Be specific." }
  ],
  "bottomLine": "2-3 sentences. Name the MVP, the biggest concern, and the single most important action item for next week."
}

ABOUT startSit:
- Include a recommendation for EVERY player on the roster
- START = confident play, top option at the position for next week
- SIT = consider benching, bad matchup or concerning trend
- FLEX = borderline, depends on other roster options
- Base the verdict on next-week projections, opponent strength, injury status, and recent trends
- If no next-week data is available, say so but still give a lean based on season trajectory

CRITICAL RULES:
- TOTAL OUTPUT should be roughly 250-350 words across all narrative fields (excluding tags/keyInsight). This is a 2-minute audio briefing, not an essay.
- NEVER fabricate statistics, scores, game events, quotes, or any factual claims
- NEVER invent data that was not provided — only reference stats, scores, and facts from the input above
- If stats show "Stats not available", say so briefly — don't invent numbers
- If opponent is "Unknown", don't guess
- When research IS available, pick the single best detail (a quote, a play, a storyline) — don't use all of them
- Use EXACTLY the player names from the roster above as keys in playerNarratives
- The tone is confident and conversational, but always grounded in the data provided`;
}

// --- Public API ---

export async function generateAINarratives(
  input: ReportInput
): Promise<ReportNarratives | null> {
  const ai = getClient();
  if (!ai) return null;

  const prompt = buildPrompt(input);

  try {
    const response = await ai.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    // Extract JSON from response (handle potential markdown code fences)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("AI response did not contain valid JSON");
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]) as ReportNarratives;

    // Validate structure
    if (!parsed.weekNarrative || !parsed.playerNarratives || !parsed.bottomLine) {
      console.error("AI response missing required fields");
      return null;
    }

    // Ensure keyInsight and tags have fallbacks for each player
    for (const [name, narr] of Object.entries(parsed.playerNarratives)) {
      if (!narr.keyInsight) narr.keyInsight = "";
      if (!narr.tags || !Array.isArray(narr.tags)) narr.tags = [];
      parsed.playerNarratives[name] = narr;
    }

    // Ensure startSit has a fallback
    if (!parsed.startSit || !Array.isArray(parsed.startSit)) {
      parsed.startSit = [];
    }

    return parsed;
  } catch (error) {
    console.error("AI narrative generation failed:", error);
    return null;
  }
}
