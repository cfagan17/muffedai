import Link from "next/link";

export default function SampleReportPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-xl font-bold text-slate-900"
          >
            Muffed
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {/* Report Header */}
        <div className="mb-10">
          <p className="text-sm font-medium text-emerald-600">
            SAMPLE REPORT
          </p>
          <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-900">
            Week 3 Report
          </h1>
          <p className="mt-2 text-slate-500">
            2024 NFL Season &middot; PPR Scoring &middot; Generated Tuesday, Sep
            24
          </p>
        </div>

        {/* Section 1: The Week in Review */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold text-slate-900">
            The Week in Review
          </h2>
          <div className="prose prose-slate max-w-none">
            <p>
              What a week. Your roster posted 142.7 points — good for your
              second-best total of the season — and it came from an unexpected
              source. While Jalen Hurts had a quiet day by his standards, Sam
              LaPorta went off for a touchdown in a Lions-Packers shootout, and
              your RB room delivered the kind of consistency that wins fantasy
              weeks.
            </p>
            <p>
              The real story, though, is your wide receiver group. Amon-Ra St.
              Brown put up a dominant target share performance that should have
              you feeling great about the rest of the season, even as one of
              your bench decisions may haunt you this week. More on that below.
            </p>
          </div>
        </section>

        {/* Section 2: Player Breakdowns */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">
            Player Breakdown
          </h2>

          {/* Player Card: LaPorta */}
          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Sam LaPorta
                </h3>
                <p className="text-sm text-slate-500">
                  TE &middot; Detroit Lions
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-600">14.7</p>
                <p className="text-xs text-slate-500">PPR Points</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                TE8 this week
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                Season avg: 12.3
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                42.5 rec yds — OVER
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                Lions -3.5 — COVERED
              </span>
            </div>

            <div className="mt-3 rounded-lg bg-slate-50 px-4 py-2 font-mono text-sm text-slate-700">
              5 rec / 7 tgt / 47 yds / 1 TD
            </div>

            <div className="prose prose-slate prose-sm mt-4 max-w-none">
              <p>
                LaPorta&apos;s stat line looks modest until you dig into what
                happened in this game. The Lions and Packers played a genuine
                shootout — the game hit the over of 48.5 by halftime and
                finished with a combined 61 points. In that environment, LaPorta
                was efficient rather than voluminous: 5 catches on 7 targets
                with a touchdown that came on a beautifully designed play-action
                look in the red zone.
              </p>
              <p>
                The two incompletions tell different stories. One was a
                throwaway under heavy pressure — the Packers blitzed on 42% of
                dropbacks, well above their 30% season average, and Goff had
                nowhere to go. The other was a contested catch in tight coverage
                that could have gone either way. Neither was a route-running or
                hands issue.
              </p>
              <p>
                The broader story is game script. Detroit jumped out 14–3 and
                leaned into the run in the second half — they ran on 68% of
                second-half plays. That limited everyone&apos;s receiving volume.
                LaPorta was also excellent as a blocker, which Dan Campbell
                specifically praised in his Monday presser.
              </p>
              <p>
                His target share has dipped from 22% to 16% over three weeks,
                coinciding with the emergence of a rookie WR who&apos;s seen his
                snap share jump from 45% to 72%. But LaPorta&apos;s red zone
                role remains untouchable — he&apos;s seen a target on 58% of the
                Lions&apos; red zone pass plays, best among TEs league-wide. The
                floor is high and the TD upside keeps the ceiling relevant.
              </p>
              <p>
                <strong>Looking ahead:</strong> Week 4 brings the Vikings, who
                have allowed the 5th-most fantasy points to TEs this season. The
                game is projected as another high-scoring affair (O/U 51.5), and
                the Lions are 6-point favorites. This is a smash spot.
              </p>
            </div>
          </div>

          {/* Player Card: Hurts */}
          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Jalen Hurts
                </h3>
                <p className="text-sm text-slate-500">
                  QB &middot; Philadelphia Eagles
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-amber-600">18.2</p>
                <p className="text-xs text-slate-500">PPR Points</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                QB14 this week
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                Season avg: 22.8
              </span>
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                235.5 pass yds — UNDER
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                Eagles -7 — COVERED
              </span>
            </div>

            <div className="mt-3 rounded-lg bg-slate-50 px-4 py-2 font-mono text-sm text-slate-700">
              218 yds / 1 TD / 0 INT / 34 rush yds / 1 rush TD
            </div>

            <div className="prose prose-slate prose-sm mt-4 max-w-none">
              <p>
                Not Hurts&apos; best day through the air, but this was a game
                the Eagles won on the ground. Philly rushed for 214 yards as a
                team against a Saints defense that came in ranked 29th against
                the run, and Nick Sirianni wisely rode what was working.
              </p>
              <p>
                Hurts&apos; rushing touchdown came on a designed QB draw on 3rd
                and goal from the 2, a play that&apos;s becoming automatic for
                this offense. He now has a rushing TD in all three games this
                season. The passing efficiency was actually fine — 72% completion
                rate, 7.6 YPA — but the volume wasn&apos;t there because the
                game script never required it. Eagles led 17–3 at half.
              </p>
              <p>
                <strong>Looking ahead:</strong> Week 4 against the Bucs should
                be a much more pass-friendly script. Tampa&apos;s defense is
                middle-of-the-pack against the run but vulnerable through the
                air. Expect a bounceback to the 22+ point range.
              </p>
            </div>
          </div>

          {/* Player Card: St. Brown */}
          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Amon-Ra St. Brown
                </h3>
                <p className="text-sm text-slate-500">
                  WR &middot; Detroit Lions
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-600">24.1</p>
                <p className="text-xs text-slate-500">PPR Points</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                WR4 this week
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                Season avg: 19.6
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                72.5 rec yds — OVER
              </span>
            </div>

            <div className="mt-3 rounded-lg bg-slate-50 px-4 py-2 font-mono text-sm text-slate-700">
              9 rec / 12 tgt / 121 yds / 1 TD
            </div>

            <div className="prose prose-slate prose-sm mt-4 max-w-none">
              <p>
                This is the Amon-Ra St. Brown experience at its best. Twelve
                targets, a 32% target share, and he turned that volume into 121
                yards and a 38-yard touchdown that showed exactly why he&apos;s
                become one of the best route runners in football. The TD came on
                a deep over route where he created three yards of separation
                against Jaire Alexander — not an easy thing to do.
              </p>
              <p>
                The underlying numbers are elite. His 32% target share is the
                highest in the league through three weeks. He&apos;s running a
                route on 95% of dropbacks. And his average depth of target (11.2
                yards) is up significantly from last year (8.4), suggesting the
                Lions are using him more aggressively downfield.
              </p>
              <p>
                <strong>Looking ahead:</strong> The Vikings secondary is the
                best unit he&apos;ll face so far this season. Byron Murphy has
                allowed the 3rd-lowest passer rating in coverage. Expect volume
                to remain elite but efficiency could dip — a 15-18 point floor
                with TD-dependent upside.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Around the NFL */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold text-slate-900">
            Around the NFL
          </h2>
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900">
                The Texans Are for Real
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Houston dismantled the Jaguars 37–17 in a game that wasn&apos;t
                even that close. C.J. Stroud threw for 4 TDs and looked like a
                top-5 QB. If you&apos;re not rostering pieces of this offense,
                the window to buy low is closed. Nico Collins is a WR1 ROS.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900">
                RB Injuries Reshaping the Landscape
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Three starting RBs went down with significant injuries this
                week. The waiver wire is about to be chaotic. If you have FAAB
                left, this is the week to be aggressive — handcuff values are at
                their highest.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900">
                The Under Revolution Continues
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                For the third straight week, unders are hitting at a 60%+ rate.
                Defenses are ahead of offenses right now, and it&apos;s showing
                in the scoring. This is relevant for fantasy: lower-scoring
                games compress outcomes and make high-floor players more
                valuable.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: The Bottom Line */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold text-slate-900">
            The Bottom Line
          </h2>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-emerald-700">B+</span>
              <div>
                <p className="font-semibold text-emerald-900">
                  Solid week. 142.7 points.
                </p>
                <p className="text-sm text-emerald-700">
                  Your roster performed above expectations thanks to big days
                  from St. Brown and LaPorta.
                </p>
              </div>
            </div>
            <div className="mt-4 border-t border-emerald-200 pt-4">
              <p className="text-sm text-emerald-800">
                <strong>Week 4 watch:</strong> The Lions-Vikings matchup is the
                one to circle. You have two players in that game (St. Brown and
                LaPorta), and it&apos;s projected as one of the highest-scoring
                games on the slate. Hurts should bounce back against Tampa in
                what projects as a more balanced game script.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-xl bg-slate-900 p-8 text-center">
          <h3 className="text-xl font-bold text-white">
            Want your own personalized report?
          </h3>
          <p className="mt-2 text-slate-400">
            Sign up, add your players, and get your first report next Tuesday.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Get Started — Free
          </Link>
        </div>
      </main>
    </div>
  );
}
