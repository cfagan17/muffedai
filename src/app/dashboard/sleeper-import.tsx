"use client";

import { useState } from "react";
import { importFromSleeper } from "./actions";

type League = {
  league_id: string;
  name: string;
  season: string;
  total_rosters: number;
  scoring_type: string;
};

type Step = "username" | "leagues" | "importing" | "done";

export default function SleeperImport() {
  const [step, setStep] = useState<Step>("username");
  const [username, setUsername] = useState("");
  const [leagues, setLeagues] = useState<League[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<string>("");

  async function handleLookup() {
    if (!username.trim()) return;
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.set("action", "lookup");
    formData.set("username", username.trim());

    const result = await importFromSleeper(formData);

    if (result.error) {
      setError(result.error);
    } else if (result.leagues) {
      setLeagues(result.leagues);
      setStep("leagues");
    }
    setLoading(false);
  }

  async function handleImport(leagueId: string) {
    setStep("importing");
    setError("");

    const formData = new FormData();
    formData.set("action", "import");
    formData.set("username", username.trim());
    formData.set("league_id", leagueId);

    const result = await importFromSleeper(formData);

    if (result.error) {
      setError(result.error);
      setStep("leagues");
    } else {
      setImportResult(result.message ?? "Roster imported!");
      setStep("done");
    }
  }

  if (step === "done") {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
        <p className="text-sm font-medium text-emerald-800">{importResult}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {step === "username" && (
        <div className="flex gap-2">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            placeholder="Sleeper username..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            onClick={handleLookup}
            disabled={loading || !username.trim()}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? "Looking up..." : "Import"}
          </button>
        </div>
      )}

      {step === "leagues" && (
        <div>
          <p className="mb-2 text-xs font-medium text-slate-600">
            Select a league to import your roster:
          </p>
          <div className="space-y-2">
            {leagues.map((league) => (
              <button
                key={league.league_id}
                onClick={() => handleImport(league.league_id)}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50"
              >
                <div>
                  <span className="font-medium text-slate-900">
                    {league.name}
                  </span>
                  <span className="ml-2 text-xs text-slate-500">
                    {league.total_rosters} teams &middot; {league.scoring_type}
                  </span>
                </div>
                <span className="text-emerald-600">&rarr;</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setStep("username");
              setLeagues([]);
            }}
            className="mt-2 text-xs text-slate-500 hover:text-slate-700"
          >
            &larr; Try a different username
          </button>
        </div>
      )}

      {step === "importing" && (
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <span className="text-sm text-slate-600">
            Importing your roster from Sleeper...
          </span>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
