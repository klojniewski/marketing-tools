"use client";

import { useState } from "react";
import { mockCandidates } from "@/lib/mock-data";
import { InfoCallout } from "./InfoCallout";
import { HelpIcon } from "./Tooltip";

export function StepGSCResults({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(
    new Set(mockCandidates.filter((c) => c.isImportant && c.clicksDiffPercent < -20).map((c) => c.url))
  );

  function toggleUrl(url: string) {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }

  function selectAll() {
    setSelectedUrls(new Set(mockCandidates.map((c) => c.url)));
  }

  function selectNone() {
    setSelectedUrls(new Set());
  }

  return (
    <div className="space-y-6">
      <InfoCallout title="How we identified these pages">
        <p>
          We compared your GSC data across both time periods. Pages shown here
          had at least 500 impressions in the baseline period and experienced a
          clicks drop exceeding your threshold. The &quot;Important&quot; flag means the
          page matches one of your topic keywords — these should generally be
          prioritized.
        </p>
      </InfoCallout>

      {/* Summary bar */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="rounded-lg bg-slate-50 px-4 py-2">
          <span className="text-muted">Pages found:</span>{" "}
          <span className="font-semibold">{mockCandidates.length}</span>
        </div>
        <div className="rounded-lg bg-blue-50 px-4 py-2">
          <span className="text-muted">Selected:</span>{" "}
          <span className="font-semibold text-accent">{selectedUrls.size}</span>
        </div>
        <div className="rounded-lg bg-emerald-50 px-4 py-2">
          <span className="text-muted">Important:</span>{" "}
          <span className="font-semibold text-emerald-700">
            {mockCandidates.filter((c) => c.isImportant).length}
          </span>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={selectAll} className="text-xs text-accent hover:underline">
            Select all
          </button>
          <span className="text-muted">|</span>
          <button onClick={selectNone} className="text-xs text-accent hover:underline">
            Select none
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="px-3 py-2.5 w-10"></th>
              <th className="px-3 py-2.5 font-medium">
                Page URL
              </th>
              <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap">
                Clicks (A)
                <HelpIcon tooltip="Clicks in the recent period (Period A). This is your current performance." />
              </th>
              <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap">
                Clicks (B)
                <HelpIcon tooltip="Clicks in the baseline period (Period B). This is what you're comparing against." />
              </th>
              <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap">
                Change
                <HelpIcon tooltip="Percentage change in clicks from Period B to Period A. Negative means declining." />
              </th>
              <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap">
                Pos. (A)
                <HelpIcon tooltip="Average position in the recent period. Higher numbers mean further down in search results." />
              </th>
              <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap">
                Pos. Shift
                <HelpIcon tooltip="How many positions the page dropped. Positive means it moved DOWN in rankings." />
              </th>
              <th className="px-3 py-2.5 font-medium text-center whitespace-nowrap">
                Flags
                <HelpIcon tooltip="Important = matches your topic keywords. Cannibal = another page on your site competes for the same query." />
              </th>
            </tr>
          </thead>
          <tbody>
            {mockCandidates.map((candidate) => {
              const isSelected = selectedUrls.has(candidate.url);
              const slug = new URL(candidate.url).pathname;

              return (
                <tr
                  key={candidate.url}
                  className={`border-t border-border transition-colors ${
                    isSelected ? "bg-blue-50/50" : "hover:bg-slate-50/50"
                  }`}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleUrl(candidate.url)}
                      className="accent-accent"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium text-sm truncate max-w-xs" title={candidate.url}>
                      {slug}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {candidate.clicksA.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {candidate.clicksB.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    <span
                      className={
                        candidate.clicksDiffPercent < -50
                          ? "text-red-600 font-medium"
                          : candidate.clicksDiffPercent < -20
                            ? "text-amber-600"
                            : "text-slate-600"
                      }
                    >
                      {candidate.clicksDiffPercent > 0 ? "+" : ""}
                      {candidate.clicksDiffPercent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {candidate.positionA.toFixed(1)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {candidate.positionDiff > 0 ? (
                      <span className="text-red-600">+{candidate.positionDiff.toFixed(1)}</span>
                    ) : (
                      <span className="text-emerald-600">{candidate.positionDiff.toFixed(1)}</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {candidate.isImportant && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                          Important
                        </span>
                      )}
                      {candidate.hasCannibalization && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800" title={`Competing with: ${candidate.cannibalizingUrl}`}>
                          Cannibal
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cannibalization note */}
      {mockCandidates.some((c) => c.hasCannibalization) && (
        <InfoCallout variant="warning" title="Cannibalization detected">
          <p>
            One or more pages are competing with another page on your site for
            the same keywords. This splits your ranking authority and can hurt
            both pages. In the results, we&apos;ll recommend whether to consolidate
            these pages.
          </p>
        </InfoCallout>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </button>
        <button
          onClick={onNext}
          disabled={selectedUrls.size === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Import Ahrefs Data ({selectedUrls.size} pages)
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
