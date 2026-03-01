/**
 * Test script: Generate a report for Jahmyr Gibbs, Week 14, 2024
 *
 * Usage:
 *   npx tsx scripts/test-report-generation.ts
 *
 * Requires ANTHROPIC_API_KEY in .env.local (or environment).
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { generateAINarratives, isAIEnabled, buildPrompt } from "../src/lib/ai";
import type { ReportInput } from "../src/lib/ai";
import type { PlayerResearch } from "../src/lib/research";
import * as fs from "fs";

// Jahmyr Gibbs — Week 14, 2024 (Lions 34 - Packers 31, TNF)
// Real stats from that game:
//   11 carries, 73 rush yds, 1 rush TD
//   3 receptions on 4 targets, 17 rec yds
//   PPR: 7.3 + 6 + 3 + 1.7 = 18.0

const gibbsInput: ReportInput = {
  weekNumber: 14,
  season: 2024,
  scoringFormat: "PPR",
  totalPoints: 18.0,
  grade: "B+",
  hasRealStats: true,
  hasRealGameData: true,
  hasWebResearch: false,
  hasSportsDataIO: true,
  hasBettingData: true,
  hasAdvancedStats: true,
  leagueNews: [
    {
      headline: "Lions clinch NFC North with TNF win",
      summary:
        "Detroit beat Green Bay 34-31 on Thursday Night Football to clinch the NFC North division title for the second straight year.",
    },
  ],
  players: [
    {
      name: "Jahmyr Gibbs",
      team: "DET",
      teamName: "Lions",
      position: "RB",
      statsLine:
        "11 carries, 73 rush yds, 1 rush TD | 3 rec (4 tgt), 17 rec yds",
      points: 18.0,
      seasonAvg: 16.2,
      positionRank: "RB8",
      opponent: "GB",
      opponentName: "Packers",
      gameScenario: "shootout",
      spread: 3.5,
      spreadFavor: true,
      gameTotal: 51.5,
      nextOpponent: "BUF",
      nextOpponentName: "Bills",
      nextMatchupFavorable: false,
      // Real game data
      gameScore: "Lions 34, Packers 31",
      gameHeadline:
        "Lions clinch NFC North with 34-31 Thursday Night Football win over Packers",
      // SportsDataIO enrichment
      injuryStatus: null,
      snapCount: "38 snaps (58%)",
      depthPosition: "Starter RB",
      projectedPointsNextWeek: 15.8,
      projectedStatsNextWeek: "Proj: 62 rush yds, 0.6 rush TD, 3.2 rec",
      // Team & betting context
      teamRecord: "12-1 (W10) — Clinched Division",
      oppRecord: "9-4",
      bettingDetails:
        "Spread: -3.5 | O/U: 51.5 | Implied team total: 27.5 | ML: -180",
      playerProps: "Rushing Yards O/U 72.5, Receptions O/U 2.5, Anytime TD -130",
      dfsSalary: "DK $7600 / FD $8200",
      // nflverse advanced analytics
      advancedStats:
        "Rushing EPA: +4.2 | Rush yards over expected: +12.1 | Target share: 11% | Carries share: 42% | Yards after contact: 3.8/att",
      // Web research
      research: {
        gameRecap:
          "Gibbs was the more efficient back in Detroit's backfield split with David Montgomery, ripping off a 28-yard run in the third quarter that set up his 3-yard TD plunge. The Lions leaned on Gibbs in passing situations, using him on wheel routes and check-downs.",
        quotes:
          'Dan Campbell: "Jahmyr gives us that home run ability. When we need to hit the explosive play, he\'s the guy."',
        injuryStatus: "Healthy — full practice participation all week",
        expertAnalysis:
          "Gibbs continues to be the preferred passing-down back and is seeing an increasing share of early-down work. His 58% snap share was a season high, suggesting Montgomery's role may be shrinking.",
        storylines:
          "The Gibbs-Montgomery timeshare has been a season-long debate, but Gibbs' snap share trend is tilting decisively in his favor.",
      },
    },
  ],
};

async function main() {
  console.log("=== Fantasy Playbook — Report Generation Test ===\n");
  console.log("Player: Jahmyr Gibbs | Week 14, 2024 | Lions 34 - Packers 31\n");

  // Always write the prompt to a file for inspection
  const prompt = buildPrompt(gibbsInput);
  fs.writeFileSync("/tmp/gibbs-prompt.txt", prompt);
  console.log(`Prompt written to /tmp/gibbs-prompt.txt (${prompt.length} chars)\n`);

  if (!isAIEnabled()) {
    console.error(
      "ERROR: ANTHROPIC_API_KEY is not set. Add it to .env.local and re-run.\n"
    );
    console.log("--- PROMPT PREVIEW (first 500 chars) ---\n");
    console.log(prompt.slice(0, 500) + "\n...\n");
    console.log(
      "--- To run the full test, set ANTHROPIC_API_KEY in .env.local ---"
    );
    process.exit(1);
  }

  console.log("Calling Claude API...\n");
  const start = Date.now();
  const result = await generateAINarratives(gibbsInput);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  if (!result) {
    console.error("ERROR: AI returned null. Check console for errors.");
    process.exit(1);
  }

  console.log(`Done in ${elapsed}s\n`);

  // --- Week Narrative ---
  console.log("═══════════════════════════════════════════════════");
  console.log("  THE WEEK IN REVIEW");
  console.log("═══════════════════════════════════════════════════\n");
  for (const para of result.weekNarrative.split("\n\n").filter(Boolean)) {
    console.log(para + "\n");
  }

  // --- Player Narrative ---
  for (const [name, narr] of Object.entries(result.playerNarratives)) {
    console.log("═══════════════════════════════════════════════════");
    console.log(`  ${name.toUpperCase()}`);
    if (narr.tags?.length > 0) {
      console.log(`  Tags: ${narr.tags.join(" | ")}`);
    }
    console.log("═══════════════════════════════════════════════════\n");

    if (narr.keyInsight) {
      console.log(`  ▶ KEY INSIGHT: ${narr.keyInsight}\n`);
    }

    console.log("--- Game Analysis ---\n");
    for (const para of narr.narrative.split("\n\n").filter(Boolean)) {
      console.log(para + "\n");
    }

    console.log("--- Looking Ahead ---\n");
    for (const para of narr.outlook.split("\n\n").filter(Boolean)) {
      console.log(para + "\n");
    }
  }

  // --- League Context ---
  if (result.leagueContext?.length > 0) {
    console.log("═══════════════════════════════════════════════════");
    console.log("  AROUND THE NFL");
    console.log("═══════════════════════════════════════════════════\n");
    for (const item of result.leagueContext) {
      console.log(`  ${item.title}`);
      console.log(`  ${item.body}\n`);
    }
  }

  // --- Bottom Line ---
  console.log("═══════════════════════════════════════════════════");
  console.log("  THE BOTTOM LINE");
  console.log("═══════════════════════════════════════════════════\n");
  console.log(result.bottomLine + "\n");

  // --- Raw JSON for inspection ---
  console.log("\n--- Raw JSON output ---\n");
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
