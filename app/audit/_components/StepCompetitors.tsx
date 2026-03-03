"use client";

import { useState } from "react";
import type { ManualCompetitor } from "@/lib/types";

interface StepCompetitorsProps {
  onNext: () => void;
  onBack: () => void;
  competitors: ManualCompetitor[];
  onCompetitorsUpdated: (competitors: ManualCompetitor[]) => void;
  targetKeyword: string;
}

export function StepCompetitors({
  onNext,
  onBack,
  competitors,
  onCompetitorsUpdated,
  targetKeyword,
}: StepCompetitorsProps) {
  const [urlInput, setUrlInput] = useState("");

  function addCompetitor() {
    const url = urlInput.trim();
    if (!url) return;
    if (competitors.some((c) => c.url === url)) return;
    onCompetitorsUpdated([
      ...competitors,
      { url, fetchStatus: "pending" },
    ]);
    setUrlInput("");
  }

  function removeCompetitor(url: string) {
    onCompetitorsUpdated(competitors.filter((c) => c.url !== url));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted mb-1">Target keyword:</p>
        <p className="font-semibold">{targetKeyword}</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="font-semibold mb-2">Add Competitor URLs</h3>
        <p className="text-sm text-muted mb-4">
          Paste URLs of competing articles that rank for your target keyword.
          These will be fetched and compared against your content.
        </p>

        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCompetitor()}
            placeholder="https://example.com/competing-article"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            onClick={addCompetitor}
            disabled={!urlInput.trim()}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-40"
          >
            Add
          </button>
        </div>

        {competitors.length > 0 && (
          <ul className="mt-4 space-y-2">
            {competitors.map((c) => (
              <li
                key={c.url}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <span className="font-mono break-all text-xs">{c.url}</span>
                <button
                  onClick={() => removeCompetitor(c.url)}
                  className="ml-2 shrink-0 text-red-400 hover:text-red-300 text-xs"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-card"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={competitors.length === 0}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-40"
        >
          Analyze
        </button>
      </div>
    </div>
  );
}
