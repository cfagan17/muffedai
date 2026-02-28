import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signout } from "../login/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-bold text-slate-900">Your Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Welcome to Fantasy Playbook. Manage your roster and view your weekly
          reports.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* My Players Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              My Players
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Add the key players from your fantasy roster to get personalized
              reports.
            </p>
            <div className="mt-6 rounded-lg border-2 border-dashed border-slate-200 p-8 text-center">
              <p className="text-sm text-slate-400">
                Player management coming soon.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                You&apos;ll be able to search and add players here.
              </p>
            </div>
          </div>

          {/* Latest Report Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Latest Report
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your personalized weekly fantasy football report.
            </p>
            <div className="mt-6 space-y-3">
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
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Settings</h2>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">
              Scoring Format
            </label>
            <div className="mt-2 flex gap-3">
              {["PPR", "Half-PPR", "Standard"].map((format) => (
                <button
                  key={format}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 data-[active=true]:border-emerald-500 data-[active=true]:bg-emerald-50 data-[active=true]:text-emerald-700"
                  data-active={format === "PPR"}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
