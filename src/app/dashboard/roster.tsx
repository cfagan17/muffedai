"use client";

import { removePlayer } from "./actions";

type RosterPlayer = {
  id: number;
  position_tag: string;
  nfl_players: {
    name: string;
    team: string;
    position: string;
  };
};

const TAG_ORDER = ["QB", "RB1", "RB2", "WR1", "WR2", "TE", "FLEX"];

export default function Roster({ players }: { players: RosterPlayer[] }) {
  const sorted = [...players].sort(
    (a, b) => TAG_ORDER.indexOf(a.position_tag) - TAG_ORDER.indexOf(b.position_tag)
  );

  if (players.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-slate-200 p-6 text-center">
        <p className="text-sm text-slate-400">
          No players added yet. Use the search above to build your roster.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex w-12 justify-center rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
              {entry.position_tag}
            </span>
            <div>
              <p className="text-sm font-medium text-slate-900">
                {entry.nfl_players.name}
              </p>
              <p className="text-xs text-slate-500">
                {entry.nfl_players.position} &middot; {entry.nfl_players.team}
              </p>
            </div>
          </div>
          <form>
            <input type="hidden" name="id" value={entry.id} />
            <button
              formAction={removePlayer}
              className="text-xs text-slate-400 hover:text-red-600"
            >
              Remove
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}
