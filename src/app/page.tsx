import Link from "next/link";

function FootballIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(-45 12 12)" />
      <path d="M7.5 7.5l9 9M9 6l1.5 1.5M6 9l1.5 1.5M15 18l1.5 1.5M18 15l1.5 1.5" />
    </svg>
  );
}

// Mock player card shown in the hero
function MockPlayerCard() {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/80 p-5 shadow-2xl backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Jahmyr Gibbs</h3>
          <p className="text-xs text-slate-400">RB &middot; Detroit Lions</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-emerald-400">22.4</p>
          <p className="text-[10px] text-slate-500">PPR Points</p>
        </div>
      </div>

      {/* Tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
          EPA Elite
        </span>
        <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
          Volume King
        </span>
        <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
          Prop Crusher
        </span>
      </div>

      {/* Stat chips */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-slate-700/60 px-2.5 py-0.5 text-[10px] font-medium text-slate-300">
          RB4 this week
        </span>
        <span className="rounded-full bg-slate-700/60 px-2.5 py-0.5 text-[10px] font-medium text-slate-300">
          Season avg: 16.8
        </span>
        <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
          72.5 rush yds &mdash; OVER
        </span>
      </div>

      {/* Stats line */}
      <div className="mt-3 rounded-lg bg-slate-900/50 px-3 py-1.5 font-mono text-xs text-slate-300">
        18 car / 109 yds / 1 TD / 3 rec / 26 rec yds
      </div>

      {/* Key Insight */}
      <div className="mt-3 rounded-lg border-l-2 border-indigo-400 bg-indigo-500/10 px-3 py-1.5">
        <p className="text-xs font-medium text-indigo-200">
          A 42% carry share with +4.2 rushing EPA — he&apos;s not splitting this backfield, he&apos;s winning it.
        </p>
      </div>

      {/* Trend bars */}
      <div className="mt-3 rounded-lg bg-slate-900/40 px-3 py-2">
        <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
          Recent Weeks
        </p>
        <div className="flex items-end gap-1">
          {[
            { w: 10, pts: 14.2 },
            { w: 11, pts: 18.7 },
            { w: 12, pts: 8.1 },
            { w: 13, pts: 21.3 },
            { w: 14, pts: 22.4 },
          ].map((d, i) => {
            const maxPts = 22.4;
            const height = Math.max((d.pts / maxPts) * 22, 2);
            const isCurrent = i === 4;
            return (
              <div key={d.w} className="flex flex-col items-center" style={{ minWidth: "20px" }}>
                <span className="mb-0.5 text-[8px] font-medium tabular-nums text-slate-500">
                  {d.pts.toFixed(0)}
                </span>
                <div
                  className={`w-2 rounded-sm ${isCurrent ? "bg-emerald-400" : "bg-slate-600"}`}
                  style={{ height: `${height}px` }}
                />
                <span className="mt-0.5 text-[7px] text-slate-600">W{d.w}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Mock start/sit section
function MockStartSit() {
  const recs = [
    { player: "Jahmyr Gibbs", verdict: "START", reason: "Elite EPA and 42% carry share vs weak Vikings run D" },
    { player: "Jalen Hurts", verdict: "START", reason: "Proj 23.5 pts vs Tampa secondary allowing 4th-most QB pts" },
    { player: "Amon-Ra St. Brown", verdict: "FLEX", reason: "Byron Murphy shadow coverage could limit ceiling" },
  ];
  const verdictColors: Record<string, string> = {
    START: "bg-emerald-500/20 text-emerald-300",
    SIT: "bg-red-500/20 text-red-300",
    FLEX: "bg-amber-500/20 text-amber-300",
  };
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/80 shadow-2xl backdrop-blur-sm overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-700/50">
        <h3 className="text-sm font-bold text-white">Next Week: Start / Sit</h3>
      </div>
      {recs.map((rec, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? "border-t border-slate-700/30" : ""}`}
        >
          <span
            className={`inline-flex w-14 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${verdictColors[rec.verdict]}`}
          >
            {rec.verdict}
          </span>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-slate-200">{rec.player}</span>
            <span className="ml-1.5 text-[10px] text-slate-500">{rec.reason}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      {/* Header */}
      <header className="relative z-10 border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <FootballIcon className="h-6 w-6 text-emerald-400" />
            <span className="text-lg font-bold text-white">
              Fantasy Playbook
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ============================================ */}
        {/* HERO — Dark with product preview */}
        {/* ============================================ */}
        <section className="relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950" />
            {/* Subtle grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
              }}
            />
            {/* Glow effects */}
            <div className="absolute -top-40 left-1/2 h-80 w-[600px] -translate-x-1/2 rounded-full bg-emerald-600/10 blur-3xl" />
            <div className="absolute top-20 right-0 h-60 w-[400px] rounded-full bg-indigo-600/5 blur-3xl" />
          </div>

          <div className="mx-auto max-w-6xl px-6 pb-24 pt-20">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              {/* Left — Copy */}
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-300">
                    AI-Powered Fantasy Intelligence
                  </span>
                </div>

                <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Your fantasy roster.
                  <br />
                  <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                    The full story.
                  </span>
                </h1>

                <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-400">
                  Personalized weekly reports that combine EPA analytics, betting
                  context, and real football narrative into a 2-minute briefing.
                  Like having a brilliant football mind who watched every snap
                  and is in your league.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-colors"
                  >
                    Get Started — Free
                  </Link>
                  <Link
                    href="/report/sample"
                    className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-300 hover:border-slate-600 hover:text-white transition-colors"
                  >
                    See a Sample Report
                  </Link>
                </div>

                {/* Trust signals */}
                <div className="mt-10 flex items-center gap-6 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    No credit card
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    60-second setup
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Sleeper import
                  </div>
                </div>
              </div>

              {/* Right — Product preview */}
              <div className="relative hidden lg:block">
                {/* Player card (main) */}
                <div className="relative z-10">
                  <MockPlayerCard />
                </div>
                {/* Start/sit (overlapping below) */}
                <div className="relative z-20 -mt-4 ml-8">
                  <MockStartSit />
                </div>
                {/* Decorative glow behind cards */}
                <div className="absolute -inset-8 -z-10 rounded-3xl bg-gradient-to-br from-emerald-600/5 to-indigo-600/5 blur-2xl" />
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* DATA SOURCES BANNER */}
        {/* ============================================ */}
        <section className="border-y border-slate-800 bg-slate-900/50">
          <div className="mx-auto max-w-6xl px-6 py-6">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {[
                { number: "8", label: "Data Sources" },
                { number: "250+", label: "Stats Per Player" },
                { number: "~2 min", label: "Audio Briefing" },
                { number: "< 60s", label: "Setup Time" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-bold text-white">{stat.number}</p>
                  <p className="mt-1 text-xs text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* HOW IT WORKS */}
        {/* ============================================ */}
        <section className="bg-slate-950 py-24">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
                How It Works
              </h2>
              <p className="mt-3 text-3xl font-bold text-white">
                Three steps to smarter fantasy decisions
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Step 1 */}
              <div className="relative rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                  <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">
                  Import Your Roster
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  Connect your Sleeper league for instant import with auto-detected
                  scoring, or add players manually. Under 60 seconds.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                  <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                  </svg>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">
                  We Analyze Everything
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  EPA, CPOE, target shares, betting lines, snap counts, injury
                  reports, press conferences — every data point, every game.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                  <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                  </svg>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">
                  Read or Listen
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  Get a personalized report with audio briefing, start/sit
                  verdicts, and the insights that actually matter for your roster.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* WHAT MAKES US DIFFERENT */}
        {/* ============================================ */}
        <section className="border-t border-slate-800 bg-slate-900/30 py-24">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
                Beyond the Box Score
              </h2>
              <p className="mt-3 text-3xl font-bold text-white">
                The data your leaguemates don&apos;t have
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-slate-400">
                Every report cross-references 8 data sources to find the insights
                that separate the signal from the noise.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                    </svg>
                  ),
                  title: "EPA & Advanced Analytics",
                  body: "Expected Points Added, CPOE, target share, WOPR, air yards, and yards after catch. Know when an 8-point week was actually elite usage.",
                  accent: "from-emerald-500/20 to-emerald-500/5",
                },
                {
                  icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  title: "Betting Context",
                  body: "Spreads, over/unders, player props, and implied team totals woven into every analysis. See who crushed their props and why.",
                  accent: "from-amber-500/20 to-amber-500/5",
                },
                {
                  icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                    </svg>
                  ),
                  title: "Audio Briefings",
                  body: "Every report comes as a ~2 minute audio version. Your personalized fantasy briefing on your commute, at the gym, or at your desk.",
                  accent: "from-violet-500/20 to-violet-500/5",
                },
                {
                  icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-3L16.5 18m0 0L12 13.5m4.5 4.5V6" />
                    </svg>
                  ),
                  title: "Start / Sit Verdicts",
                  body: "Data-backed recommendations for every player. Matchup analysis, projections vs season average, and injury context in one clear call.",
                  accent: "from-sky-500/20 to-sky-500/5",
                },
                {
                  icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  ),
                  title: "Week-over-Week Trends",
                  body: "Visual sparklines track each player\u2019s trajectory across the season. Spot breakouts and busts before your leaguemates do.",
                  accent: "from-pink-500/20 to-pink-500/5",
                },
                {
                  icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  ),
                  title: "Sleeper Integration",
                  body: "Enter your username and import your full roster instantly. Scoring format auto-detected. Zero manual data entry required.",
                  accent: "from-orange-500/20 to-orange-500/5",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="group relative rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-colors hover:border-slate-700"
                >
                  <div className={`absolute inset-0 -z-10 rounded-2xl bg-gradient-to-b ${feature.accent} opacity-0 transition-opacity group-hover:opacity-100`} />
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-emerald-400 ring-1 ring-slate-700">
                    {feature.icon}
                  </div>
                  <h3 className="mt-4 font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {feature.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* MOBILE PRODUCT PREVIEW (visible on small screens) */}
        {/* ============================================ */}
        <section className="border-t border-slate-800 bg-slate-950 py-16 lg:hidden">
          <div className="mx-auto max-w-md px-6">
            <p className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-emerald-400">
              What Your Report Looks Like
            </p>
            <MockPlayerCard />
            <div className="mt-4">
              <MockStartSit />
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* SAMPLE REPORT CALLOUT */}
        {/* ============================================ */}
        <section className="border-t border-slate-800 bg-slate-900/50 py-24">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-4 py-1.5">
              <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="text-xs font-semibold text-slate-300">Full Sample Available</span>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-white">
              See a complete report before you sign up
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-400">
              We built a full sample report with real player analysis, betting context,
              and narrative breakdowns so you know exactly what you&apos;re getting.
            </p>
            <div className="mt-8">
              <Link
                href="/report/sample"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-semibold text-white hover:border-emerald-600 hover:bg-slate-700 transition-colors"
              >
                Read the Sample Report
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* FINAL CTA */}
        {/* ============================================ */}
        <section className="relative border-t border-slate-800 py-24">
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-emerald-950/30 to-slate-950" />
          <div className="mx-auto max-w-2xl px-6 text-center">
            <FootballIcon className="mx-auto h-10 w-10 text-emerald-500/30" />
            <h2 className="mt-6 text-4xl font-bold tracking-tight text-white">
              Stop guessing.
              <br />
              <span className="text-emerald-400">Start knowing.</span>
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Your first report is free. No credit card required.
            </p>
            <div className="mt-8">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-colors"
              >
                Get Your First Report
              </Link>
            </div>
            <p className="mt-6 text-xs text-slate-600">
              Import from Sleeper or add players manually. Report ready in under 2 minutes.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FootballIcon className="h-4 w-4 text-slate-700" />
            <span className="text-sm text-slate-700">Fantasy Playbook</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/report/sample" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
              Sample Report
            </Link>
            <Link href="/login" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
              Log in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
