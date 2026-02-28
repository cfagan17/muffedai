import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-slate-900">
            Fantasy Playbook
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-slate-900">
            Your fantasy roster.
            <br />
            <span className="text-emerald-600">The full story.</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Fantasy Playbook generates personalized weekly reports that combine
            fantasy scoring, advanced analytics, betting context, and real
            football narrative. Like having a brilliant football friend who
            watched every game and is in your league.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
            >
              Create Free Account
            </Link>
            <Link
              href="/report/sample"
              className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              See a Sample Report
            </Link>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mt-24 grid max-w-4xl grid-cols-1 gap-8 pb-24 md:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 text-xl font-bold">
              1
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              Add Your Players
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Enter 5-8 key players from your fantasy roster. Takes under 60
              seconds.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 text-xl font-bold">
              2
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              We Watch the Games
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Our system pulls stats, analytics, betting data, and real football
              context from every game.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 text-xl font-bold">
              3
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              Read Tuesday Morning
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Get a personalized report that reads like SportsCenter meets your
              fantasy roster.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
