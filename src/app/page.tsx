import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-slate-900">
            Fantasy Playbook
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Log in
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-50/50 to-white" />
          <div className="mx-auto max-w-3xl px-6 pb-20 pt-24 text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-emerald-600">
              AI-Powered Fantasy Football
            </p>
            <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Your fantasy roster.
              <br />
              <span className="text-emerald-600">The full story.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Personalized weekly reports that combine advanced analytics, betting
              context, and real football narrative. Like having a brilliant football
              friend who watched every game and is in your league.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/login"
                className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
              >
                Get Started — Free
              </Link>
              <Link
                href="/report/sample"
                className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                See a Sample Report
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="border-t border-slate-100 bg-white py-20">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-slate-400">
              How It Works
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-xl font-bold text-emerald-700">
                  1
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  Import Your Roster
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Connect your Sleeper league for instant import, or add 5-8
                  players manually. Under 60 seconds either way.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-xl font-bold text-emerald-700">
                  2
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  We Analyze Everything
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Our engine pulls box scores, EPA, target shares, betting lines,
                  injury reports, and press conferences. Every angle, every game.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-xl font-bold text-emerald-700">
                  3
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  Read or Listen
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Get a personalized report you can read or listen to as a
                  2-minute audio briefing. Start/sit recommendations included.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-slate-100 bg-slate-50 py-20">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-slate-400">
              What You Get
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="font-semibold text-slate-900">
                  Advanced Analytics
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  EPA, CPOE, target share, WOPR, air yards, and YAC data — the
                  metrics that reveal what the box score hides. Know when a
                  player&apos;s 8-point week was actually elite usage.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="font-semibold text-slate-900">
                  Betting Context
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Game spreads, over/unders, player props, and implied team
                  totals woven into every analysis. See who crushed their props
                  and which game scripts inflated stats.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="font-semibold text-slate-900">
                  Audio Briefings
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Every report comes with a ~2 minute audio version. Listen to
                  your personalized fantasy briefing on your commute, at the gym,
                  or while pretending to work.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="font-semibold text-slate-900">
                  Start / Sit Verdicts
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Data-backed recommendations for every player on your roster.
                  Matchup analysis, projections vs season average, and injury
                  context — all in one clear verdict.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="font-semibold text-slate-900">
                  Week-over-Week Trends
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Visual sparklines show each player&apos;s scoring trajectory across
                  the season. Spot breakouts and busts before your leaguemates
                  do.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="font-semibold text-slate-900">
                  Sleeper Integration
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Enter your Sleeper username and import your full roster
                  instantly. Scoring format auto-detected. No manual data entry
                  required.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-slate-100 bg-white py-20">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Stop guessing. Start knowing.
            </h2>
            <p className="mt-4 text-slate-600">
              Your first report is free. No credit card required.
            </p>
            <div className="mt-8">
              <Link
                href="/login"
                className="rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
              >
                Get Your First Report
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-5xl px-6 text-center text-sm text-slate-400">
          Fantasy Playbook
        </div>
      </footer>
    </div>
  );
}
