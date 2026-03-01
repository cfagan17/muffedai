import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signout } from "@/app/login/actions";
import AudioPlayer from "./audio-player";
import PlayerTrends from "./player-trends";

type BettingLine = {
  label: string;
  result: string;
};

type BettingAndInsights = {
  lines?: BettingLine[];
  keyInsight?: string | null;
  tags?: string[];
  // Backwards compat: old reports stored betting lines as a flat array
  label?: string;
  result?: string;
};

type LeagueItem = {
  title: string;
  body: string;
};

type StartSitItem = {
  player: string;
  verdict: "START" | "SIT" | "FLEX";
  reason: string;
};

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reportId = Number(id);
  if (isNaN(reportId)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch report
  const { data: report } = await supabase
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .eq("user_id", user.id)
    .single();

  if (!report) notFound();

  // Fetch player breakdowns with player info
  const { data: reportPlayers } = await supabase
    .from("report_players")
    .select("*, nfl_players(name, team, position)")
    .eq("report_id", reportId)
    .order("points", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const players = ((reportPlayers ?? []) as any[]).map((rp) => {
    // Handle both old format (flat array) and new format (object with lines/keyInsight/tags)
    const rawBetting = rp.betting_lines;
    let bettingLines: BettingLine[] = [];
    let keyInsight: string | null = null;
    let tags: string[] = [];

    if (Array.isArray(rawBetting)) {
      // Old format: flat array of {label, result}
      bettingLines = rawBetting as BettingLine[];
    } else if (rawBetting && typeof rawBetting === "object") {
      // New format: {lines, keyInsight, tags}
      const data = rawBetting as BettingAndInsights;
      bettingLines = (data.lines ?? []) as BettingLine[];
      keyInsight = data.keyInsight ?? null;
      tags = data.tags ?? [];
    }

    return {
      id: rp.id as number,
      position_tag: rp.position_tag as string,
      points: rp.points as number,
      season_avg: rp.season_avg as number,
      position_rank: rp.position_rank as string,
      stats_line: rp.stats_line as string,
      betting_lines: bettingLines,
      keyInsight,
      tags,
      narrative: rp.narrative as string,
      outlook: rp.outlook as string,
      nfl_players: rp.nfl_players as { name: string; team: string; position: string },
    };
  });

  // Fetch historical points for trend sparklines
  const playerIds = players.map((p) => p.id);
  const playerIdToNflId = new Map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((reportPlayers ?? []) as any[]).map((rp) => [rp.id as number, rp.player_id as number])
  );

  // Get all report_players for this user's reports in the same season
  const { data: trendData } = await supabase
    .from("report_players")
    .select("player_id, points, report_id, reports!inner(week_number, season, user_id)")
    .eq("reports.user_id", user.id)
    .eq("reports.season", report.season)
    .order("report_id", { ascending: true });

  // Build trend map: nfl_player_id -> {week, points}[]
  const trendMap = new Map<number, { week: number; points: number }[]>();
  if (trendData) {
    for (const row of trendData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = row as any;
      const weekNum = r.reports?.week_number;
      if (weekNum == null || r.points == null) continue;
      const arr = trendMap.get(r.player_id) ?? [];
      arr.push({ week: weekNum, points: Number(r.points) });
      trendMap.set(r.player_id, arr);
    }
  }
  // Sort each player's trend by week
  for (const arr of trendMap.values()) {
    arr.sort((a, b) => a.week - b.week);
  }

  const leagueContext = (report.league_context ?? []) as LeagueItem[];
  const startSit = (report.start_sit ?? []) as StartSitItem[];
  const createdAt = new Date(report.created_at);
  const dateStr = createdAt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  // Color for points based on performance
  function pointsColor(points: number, position: string): string {
    const thresholds: Record<string, number> = { QB: 18, RB: 12, WR: 12, TE: 10 };
    const threshold = thresholds[position] ?? 12;
    return points >= threshold ? "text-emerald-600" : points >= threshold * 0.7 ? "text-amber-600" : "text-red-600";
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-xl font-bold text-slate-900">
            Muffed
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{user.email}</span>
            <form>
              <button
                formAction={signout}
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
        >
          &larr; Back to Dashboard
        </Link>

        {/* Report Header */}
        <div className="mt-6 mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            {report.title}
          </h1>
          <p className="mt-2 text-slate-500">
            {report.season} NFL Season &middot; {report.scoring_format} Scoring
            &middot; Generated {dateStr}
          </p>
        </div>

        {/* Audio Player */}
        {report.audio_url && (
          <div className="mb-8">
            <AudioPlayer audioUrl={report.audio_url as string} />
          </div>
        )}

        {/* Week in Review */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold text-slate-900">
            The Week in Review
          </h2>
          <div className="prose prose-slate max-w-none">
            {(report.week_narrative as string).split("\n\n").filter(Boolean).map((para: string, i: number) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </section>

        {/* Player Breakdowns */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">
            Player Breakdown
          </h2>

          {players.map((player) => (
            <div
              key={player.id}
              className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {player.nfl_players.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {player.nfl_players.position} &middot;{" "}
                    {player.nfl_players.team}
                  </p>
                </div>
                {player.points != null && (
                  <div className="text-right">
                    <p
                      className={`text-2xl font-bold ${pointsColor(
                        player.points,
                        player.nfl_players.position
                      )}`}
                    >
                      {player.points}
                    </p>
                    <p className="text-xs text-slate-500">
                      {report.scoring_format} Points
                    </p>
                  </div>
                )}
              </div>

              {/* Tags (AI-generated insight labels) */}
              {player.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {player.tags.map((tag: string, i: number) => (
                    <span
                      key={i}
                      className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {player.position_rank && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {player.position_rank} this week
                  </span>
                )}
                {player.season_avg != null && player.season_avg > 0 && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    Season avg: {player.season_avg}
                  </span>
                )}
                {player.betting_lines.map(
                  (line: BettingLine, i: number) => (
                    <span
                      key={i}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        line.result === "OVER" || line.result === "COVERED"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {line.label} &mdash; {line.result}
                    </span>
                  )
                )}
              </div>

              {player.stats_line && (
                <div className="mt-3 rounded-lg bg-slate-50 px-4 py-2 font-mono text-sm text-slate-700">
                  {player.stats_line}
                </div>
              )}

              {/* Week-over-week trend sparkline */}
              {(() => {
                const nflId = playerIdToNflId.get(player.id);
                const trend = nflId ? trendMap.get(nflId) : undefined;
                return trend && trend.length >= 2 ? (
                  <PlayerTrends data={trend} currentWeek={report.week_number} />
                ) : null;
              })()}

              {/* Key Insight callout */}
              {player.keyInsight && (
                <div className="mt-3 rounded-lg border-l-4 border-indigo-400 bg-indigo-50 px-4 py-2">
                  <p className="text-sm font-medium text-indigo-900">
                    {player.keyInsight}
                  </p>
                </div>
              )}

              <div className="prose prose-slate prose-sm mt-4 max-w-none">
                {player.narrative ? (
                  player.narrative.split("\n\n").filter(Boolean).map((para: string, i: number) => (
                    <p key={i}>{para}</p>
                  ))
                ) : (
                  <p className="text-slate-400 italic">
                    No narrative available for this player.
                  </p>
                )}
                {player.outlook && (
                  <p><strong>Next week:</strong> {player.outlook}</p>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* Around the NFL */}
        {leagueContext.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              Around the NFL
            </h2>
            <div className="space-y-6">
              {leagueContext.map((item: LeagueItem, i: number) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{item.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Start/Sit Recommendations */}
        {startSit.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              Next Week: Start / Sit
            </h2>
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {startSit.map((rec, i) => {
                const verdictColors = {
                  START: "bg-emerald-100 text-emerald-800",
                  SIT: "bg-red-100 text-red-800",
                  FLEX: "bg-amber-100 text-amber-800",
                };
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-4 px-5 py-3 ${
                      i > 0 ? "border-t border-slate-100" : ""
                    }`}
                  >
                    <span
                      className={`inline-flex w-16 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
                        verdictColors[rec.verdict] ?? "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {rec.verdict}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-slate-900">
                        {rec.player}
                      </span>
                      <span className="ml-2 text-sm text-slate-500">
                        {rec.reason}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Bottom Line */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold text-slate-900">
            The Bottom Line
          </h2>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
            <div className="flex items-center gap-3">
              {report.grade && (
                <span className="text-3xl font-bold text-emerald-700">
                  {report.grade}
                </span>
              )}
              <div>
                <p className="font-semibold text-emerald-900">
                  {report.summary}
                </p>
              </div>
            </div>
            {report.bottom_line && (
              <div className="mt-4 border-t border-emerald-200 pt-4 space-y-2">
                {(report.bottom_line as string).split("\n\n").filter(Boolean).map((para: string, i: number) => (
                  <p key={i} className="text-sm text-emerald-800">{para}</p>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
