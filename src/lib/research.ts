/**
 * Claude-powered web research for enriching fantasy football reports.
 *
 * Uses Claude with the web_search server tool to gather real-world context:
 *   - Game recaps and key plays
 *   - Post-game press conference quotes
 *   - Injury updates and status changes
 *   - Expert fantasy analysis
 *   - Broader NFL storylines
 *
 * Falls back to null when research is unavailable so callers can
 * proceed without it (narratives will still be generated, just less rich).
 */

import Anthropic from "@anthropic-ai/sdk";

// --- Types ---

export type PlayerResearch = {
  gameRecap: string;
  quotes: string;
  injuryStatus: string;
  expertAnalysis: string;
  storylines: string;
};

export type LeagueNewsItem = {
  headline: string;
  summary: string;
};

export type ResearchResult = {
  players: Record<string, PlayerResearch>;
  leagueNews: LeagueNewsItem[];
};

// --- Client ---

const apiKey = process.env.ANTHROPIC_API_KEY;

function getClient(): Anthropic | null {
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

// --- Public API ---

/**
 * Research players' recent games and broader NFL context using Claude web search.
 *
 * Makes a single Claude API call with web_search tool enabled. Claude will
 * autonomously search for game recaps, press conferences, injury updates,
 * and expert analysis for each player on the roster.
 *
 * @param players - List of players to research
 * @param weekNumber - NFL week number
 * @param season - NFL season year
 * @param espnHeadlines - Optional ESPN headlines to provide additional context
 * @returns Structured research results, or null if unavailable
 */
export async function researchPlayers(
  players: { name: string; team: string; position: string }[],
  weekNumber: number,
  season: number,
  espnHeadlines?: { headline: string; description: string }[]
): Promise<ResearchResult | null> {
  const client = getClient();
  if (!client) return null;

  const playerList = players
    .map((p) => `- ${p.name} (${p.team}, ${p.position})`)
    .join("\n");

  const headlineContext = espnHeadlines?.length
    ? `\n\nFor additional context, here are recent ESPN NFL headlines:\n${espnHeadlines
        .slice(0, 5)
        .map((h) => `- ${h.headline}`)
        .join("\n")}`
    : "";

  const searchBudget = Math.min(players.length * 2 + 3, 20);

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: searchBudget,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ],
      messages: [
        {
          role: "user",
          content: `You are a fantasy football research analyst. Research the following NFL players' Week ${weekNumber} performances in the ${season} NFL season.

For each player, search the web and compile:
1. **Game recap** — What happened in their game? Key plays, game flow, how they performed. Be specific about snaps, routes, carries, targets.
2. **Quotes** — Notable postgame quotes from the player, their coach, or opposing coaches about them. If no quotes found, note "No quotes found."
3. **Injury status** — Any injury concerns, limited practices, or returns from injury. If healthy, say "Healthy — no injury concerns."
4. **Expert analysis** — What fantasy analysts and beat reporters are saying about their value, usage trends, and outlook.
5. **Storylines** — Anything newsworthy: milestones, records, trade rumors, scheme changes, depth chart shifts.

Also research 3 broader NFL stories from Week ${weekNumber} that fantasy managers should know about — major injuries, emerging players, coaching changes, trade deadline implications, etc.

Players to research:
${playerList}${headlineContext}

IMPORTANT: Return your findings as a JSON object with this exact structure. Use EXACTLY the player names listed above as keys. Return ONLY valid JSON, no other text.

{
  "players": {
    "PLAYER_NAME": {
      "gameRecap": "2-4 sentences summarizing their game performance with specific details",
      "quotes": "Direct or paraphrased postgame quotes, or 'No quotes found'",
      "injuryStatus": "Current injury status or 'Healthy — no injury concerns'",
      "expertAnalysis": "What experts are saying about their fantasy value and outlook",
      "storylines": "Any notable storylines, or 'None' if nothing notable"
    }
  },
  "leagueNews": [
    {
      "headline": "Short headline (under 10 words)",
      "summary": "2-3 sentences about the story and its fantasy implications"
    }
  ]
}`,
        },
      ],
    });

    // Extract text content from the response (web search results are handled
    // server-side; we just need the final text blocks)
    const text = response.content
      .filter(
        (block): block is Anthropic.TextBlock => block.type === "text"
      )
      .map((block) => block.text)
      .join("");

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Research response did not contain valid JSON");
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]) as ResearchResult;

    // Validate structure
    if (!parsed.players || typeof parsed.players !== "object") {
      console.error("Research response missing players field");
      return null;
    }

    // Ensure leagueNews is an array
    if (!Array.isArray(parsed.leagueNews)) {
      parsed.leagueNews = [];
    }

    return parsed;
  } catch (error) {
    console.error("Player research failed:", error);
    return null;
  }
}
