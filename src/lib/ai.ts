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

type ReportNarratives = {
  weekNarrative: string;
  playerNarratives: Record<string, PlayerNarrative>; // keyed by player name
  leagueContext: { title: string; body: string }[];
  bottomLine: string;
};

export type { PlayerInput, ReportInput, ReportNarratives, PlayerNarrative };

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

  return `You are the lead analyst for Fantasy Playbook, a premium fantasy football report that reads like The Ringer meets ESPN Fantasy Focus. Write the narrative sections for a Week ${input.weekNumber} report (${input.season} season, ${input.scoringFormat} scoring).

${dataContext}

The user's roster scored ${input.totalPoints} total points — graded as a ${input.grade} week.

ROSTER:
${playerSummaries}${leagueNewsSection}

Write the following sections as JSON. Your writing should be vivid, specific, and authoritative — like a sharp fantasy analyst who watched every snap of every game. This isn't generic stat recitation; it's insight-driven storytelling.

KEY GUIDELINES:
- When web research is provided for a player, USE IT. Reference specific game moments, quote coaches or players, mention real storylines. This is what separates a great report from a generic one.
- When real game scores are provided, reference them. "The Chiefs' 24-17 win over the Lions" is more compelling than "a competitive game."
- Cross-reference players when they share the same game or have contrasting performances.
- Be opinionated. Take positions on whether a performance is sustainable or a fluke.
- Use advanced football language naturally: snap share, target share, air yards, red zone share, route participation, defensive front, coverage shell.
- When snap counts are provided, USE THEM to discuss workload and usage trends. "He played 58 of 65 snaps (89%)" adds real insight.
- When depth chart status is provided, USE IT to discuss role security and opportunity. A starter with high snap counts tells a different story than a backup who got garbage-time work.
- When injury data is provided, ALWAYS address it in the outlook section. Injury context is critical for fantasy decisions.
- When next-week projections are provided, reference them in the outlook — compare projected points to season average to frame expectations.
- When team records and standings are provided, USE THEM to frame game script narratives. A 10-2 team playing a 3-9 team creates a clear game script expectation. Teams on winning/losing streaks play differently. Playoff implications affect coaching decisions (resting starters, conservative play-calling).
- When betting lines are provided (spreads, O/U, implied totals, moneylines), USE THEM to add sharp analysis. Compare actual game results to the betting line: "The Bills were 7-point favorites and won by 3 — a closer game than Vegas expected, which inflated garbage-time targets." Implied team totals help frame expected scoring environments.
- When player props are provided, USE THEM for context. Compare actual performance to the prop line: "Mahomes' 312 passing yards sailed over his 275.5 prop" or "The rushing yards fell short of his 85.5 prop, which should concern PPR managers." Props reveal market expectations vs. reality.
- When DFS salaries are provided, mention them to add a "value" angle. "At $7,200 on DraftKings, he's a screaming value if this target share holds" adds cross-format relevance.
- When advanced analytics are provided (EPA, CPOE, air yards, YAC, target share, WOPR), USE THEM to separate surface-level stats from underlying quality. EPA is the gold standard — a QB with positive passing EPA is genuinely helping his team score, while negative EPA means the offense moved backwards on his plays even if the box score looks fine. CPOE (Completion Percentage Over Expected) shows whether a QB is completing passes harder or easier than expected — positive CPOE means he's making throws other QBs would miss. Use EPA and CPOE together to identify players who were better or worse than their stat line suggests.
- Target share and WOPR reveal opportunity quality: "His 28% target share and 0.52 WOPR show he's the clear alpha in this offense." Air yards share distinguishes deep threats from underneath receivers. RACR (receiving yards / air yards) above 1.0 means the player is generating YAC, below 1.0 means he's dropping deep balls or the QB is missing him.
- Reference specific drives or quarters when the research supports it.
- The tone is confident and conversational — you're a trusted fantasy advisor talking to a friend who takes their league seriously.

Return ONLY valid JSON with this exact structure:
{
  "weekNarrative": "4-5 paragraphs reviewing the week. Paragraph 1: Open with the headline performance — who won the week and why, referencing the final score and game script. Paragraph 2: The deeper story — what the advanced analytics reveal. Highlight EPA leaders/laggards, note where box score stats are misleading (e.g., 'Player X put up 18 points but his -2.1 receiving EPA shows most of that production came on one broken play'). Reference target shares and snap counts to discuss workload trends. Paragraph 3: Betting and game-flow context — how did actual results compare to Vegas expectations? Did any games play out differently than the spread predicted, and how did that affect your players? Paragraph 4: Cross-reference players who share games or have contrasting performances. A QB and his WR on the same roster, or two players on opposite sides of the same blowout. Paragraph 5: Close with what this week tells us about the roster's trajectory — trends to ride, concerns to address, and moves to consider.",
  "playerNarratives": {
    "PLAYER_NAME": {
      "narrative": "3-4 paragraphs of game analysis.\n\nParagraph 1: What happened and why. Lead with the stat line and score, referencing the opponent, game script, and any key moments from web research. Use the final score and betting line to frame the game — was it competitive or a blowout?\n\nParagraph 2: Under the hood. This is where the report earns its premium. Discuss EPA to separate real production from noise. Reference snap counts to confirm workload, target share and WOPR to evaluate opportunity quality, and air yards vs YAC to understand how the production was generated. For QBs, use CPOE and Dakota to assess accuracy beyond completion percentage. Compare actual stats to player prop lines when available ('His 87 rushing yards cleared the 72.5 prop, but just barely').\n\nParagraph 3: Context and sustainability. Reference team record, standings implications, and depth chart status. Is this role secure? Was the production game-script-dependent (a team trailing throws more)? Use DFS salary to add value context. Reference web research quotes or storylines when available.",
      "outlook": "1-2 paragraphs about next week. Reference the upcoming opponent by name and record. Use the next-week projection as a baseline ('Projected for 14.2 points, right at his season average of 14.8'). Discuss any injury concerns, matchup advantages/disadvantages, and whether the advanced metrics suggest regression or continued production. Be specific about what to expect and why.",
      "keyInsight": "One sharp, data-driven sentence that captures the most important takeaway. Use a specific stat or comparison. Example: 'His +8.4 passing EPA was elite, but 40% of it came on one broken coverage — the Dakota composite of +0.02 tells the truer story.' Or: 'A 31% target share with 0.48 WOPR makes him matchup-proof regardless of game script.'",
      "tags": ["2-4 short labels that categorize this player's week. Choose from tags like: 'EPA Elite', 'EPA Concern', 'Volume King', 'Target Hog', 'Efficiency Monster', 'Boom Game', 'Bust Alert', 'Buy Low', 'Sell High', 'Workload Watch', 'Injury Risk', 'Breakout', 'TD Dependent', 'Garbage Time', 'Matchup Proof', 'Game Script Winner', 'Snap Count Alert', 'Prop Crusher', 'Under the Radar'"]
    }
  },
  "leagueContext": [
    { "title": "Short headline (under 8 words)", "body": "3-4 sentences about an NFL story that matters for fantasy. If web research provided league news, use those real stories. Reference real teams, players, and situations. Explain the fantasy implication clearly." },
    { "title": "Short headline", "body": "Another relevant story." },
    { "title": "Short headline", "body": "Another relevant story." }
  ],
  "bottomLine": "4-5 sentences. Start with the grade and what it means. Name the MVP of the week and the biggest disappointment. Highlight one advanced-stat trend the reader should pay attention to going forward (e.g., 'Watch Lamb's target share — 29% is alpha territory and it's sustainable with Prescott healthy'). End with the single most important action item for next week."
}

DATA INTEGRITY — THIS IS CRITICAL:
- NEVER fabricate statistics, scores, game events, quotes, or any factual claims
- NEVER invent data that was not provided — only reference stats, scores, and facts from the input above
- If a player's stats show "Stats not available", acknowledge this honestly — do NOT invent a stat line or pretend to know how they performed. You may still write about them using web research if available.
- If opponent is "Unknown", do not guess who they played
- If next week's opponent is "Unknown", say the matchup information is not yet available
- Only reference quotes, plays, or specific game moments if they come from the web research provided
- When research IS available, USE IT — reference specific game moments, quote coaches or players, cite real storylines
- When research is NOT available, write analytically based only on the confirmed stats and game context provided — no speculation presented as fact

FORMATTING:
- Use EXACTLY the player names from the roster above as keys in playerNarratives
- Make narratives feel unique to each player and game, never templated
- Be specific with real data: "He caught 7 of 9 targets for 89 yards" beats "He had a solid day receiving"
- Cross-reference players when they share games or have contrasting performances
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
      max_tokens: 10000,
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

    return parsed;
  } catch (error) {
    console.error("AI narrative generation failed:", error);
    return null;
  }
}
