"use client";

import { updateScoringFormat } from "./actions";
import { useTransition } from "react";

const FORMATS = ["PPR", "Half-PPR", "Standard"] as const;

export default function ScoringFormat({
  currentFormat,
}: {
  currentFormat: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSelect(format: string) {
    if (format === currentFormat) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("scoring_format", format);
      await updateScoringFormat(formData);
    });
  }

  return (
    <div className="flex gap-3">
      {FORMATS.map((format) => (
        <button
          key={format}
          onClick={() => handleSelect(format)}
          disabled={isPending}
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            currentFormat === format
              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-slate-300 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
          } ${isPending ? "opacity-50" : ""}`}
        >
          {format}
        </button>
      ))}
    </div>
  );
}
