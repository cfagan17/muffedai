import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signout } from "../login/actions";
import PlayerSearch from "./player-search";
import Roster from "./roster";
import ScoringFormat from "./scoring-format";
import GenerateButton from "./generate-button";
import SleeperImport from "./sleeper-import";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile (scoring format)
  const { data: profile } = await supabase
    .from("profiles")
    .select("scoring_format")
    .eq("id", user.id)
    .single();

  // Fetch user's roster with player details
  const { data: roster } = await supabase
    .from("user_players")
    .select("id, position_tag, nfl_players(name, team, position)")
    .eq("user_id", user.id)
    .order("created_at");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rosterPlayers = ((roster ?? []) as any[]).map((r) => ({
    id: r.id as number,
    position_tag: r.position_tag as string,
    nfl_players: r.nfl_players as { name: string; team: string; position: string },
  }));

  const usedPositionTags = rosterPlayers.map((p) => p.position_tag);
  const scoringFormat = profile?.scoring_format ?? "PPR";

  // Fetch user's reports
  const { data: reports } = await supabase
    .from("reports")
    .select("id, title, total_points, grade, summary, created_at, week_number, season")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-slate-900">
            Fantasy Playbook
          </span>
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

      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-bold text-slate-900">Your Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Manage your roster and view your weekly reports.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* My Players Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              My Players
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Add 5-8 key players from your fantasy roster.{" "}
              <span className="font-medium">
                {rosterPlayers.length}/7 slots filled.
              </span>
            </p>

            {/* Sleeper Import */}
            {rosterPlayers.length === 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-slate-600">
                  Import from Sleeper
                </p>
                <SleeperImport />
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-slate-400">or add manually</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4">
              <PlayerSearch usedPositionTags={usedPositionTags} />
            </div>

            <div className="mt-6">
              <Roster players={rosterPlayers} />
            </div>
          </div>

          {/* Reports Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Weekly Reports
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your personalized weekly fantasy football reports.
            </p>

            <div className="mt-4">
              <GenerateButton hasPlayers={rosterPlayers.length > 0} />
            </div>

            <div className="mt-6 space-y-3">
              {reports && reports.length > 0 ? (
                reports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/dashboard/reports/${report.id}`}
                    className="block rounded-lg border border-slate-200 p-4 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">
                          {report.title}
                        </p>
                        <p className="text-sm text-slate-500">
                          {report.summary}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {report.grade && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-sm font-bold text-emerald-700">
                            {report.grade}
                          </span>
                        )}
                        <span className="text-emerald-600">&rarr;</span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <Link
                  href="/report/sample"
                  className="block rounded-lg border border-slate-200 p-4 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">
                        Sample Report — Week 3
                      </p>
                      <p className="text-sm text-slate-500">
                        See what your weekly report will look like
                      </p>
                    </div>
                    <span className="text-emerald-600">&rarr;</span>
                  </div>
                </Link>
              )}
            </div>

            {/* Settings */}
            <div className="mt-8 border-t border-slate-200 pt-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Scoring Format
              </h3>
              <div className="mt-3">
                <ScoringFormat currentFormat={scoringFormat} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
