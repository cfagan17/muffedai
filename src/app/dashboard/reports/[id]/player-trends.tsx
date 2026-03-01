"use client";

type TrendPoint = {
  week: number;
  points: number;
};

export default function PlayerTrends({
  data,
  currentWeek,
}: {
  data: TrendPoint[];
  currentWeek: number;
}) {
  if (data.length < 2) return null;

  const maxPts = Math.max(...data.map((d) => d.points), 1);
  const barHeight = 24; // px

  return (
    <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        Recent Weeks
      </p>
      <div className="flex items-end gap-0.5">
        {data.map((d) => {
          const height = Math.max((d.points / maxPts) * barHeight, 2);
          const isCurrent = d.week === currentWeek;
          return (
            <div key={d.week} className="flex flex-col items-center" style={{ minWidth: "18px" }}>
              <span className="mb-0.5 text-[9px] font-medium text-slate-500 tabular-nums">
                {d.points > 0 ? d.points.toFixed(0) : ""}
              </span>
              <div
                className={`w-2.5 rounded-sm ${
                  isCurrent ? "bg-emerald-500" : "bg-slate-300"
                }`}
                style={{ height: `${height}px` }}
              />
              <span className="mt-0.5 text-[8px] text-slate-400">
                W{d.week}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
