"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateReport } from "./generate-report";

export default function GenerateButton({ hasPlayers }: { hasPlayers: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    const result = await generateReport();

    if (result.error) {
      setError(result.error);
      // If report already exists, navigate to it
      if (result.reportId) {
        router.push(`/dashboard/reports/${result.reportId}`);
        return;
      }
      setLoading(false);
      return;
    }

    if (result.reportId) {
      router.push(`/dashboard/reports/${result.reportId}`);
    } else {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={loading || !hasPlayers}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate Weekly Report"}
      </button>
      {!hasPlayers && (
        <p className="mt-2 text-xs text-slate-500">
          Add at least one player to generate a report.
        </p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
