"use client";

import { useState } from "react";
import { mockLLMResults, mockCompetitors } from "@/lib/mock-data";
import type { LLMAnalysis } from "@/lib/types";
import { InfoCallout } from "./InfoCallout";
import { HelpIcon } from "./Tooltip";

function ResultCard({
  result,
  isExpanded,
  onToggle,
}: {
  result: LLMAnalysis;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const slug = new URL(result.candidateUrl).pathname;
  const competitors = mockCompetitors.filter((c) =>
    result.worsePoints.length > 0
  );

  const priorityColors = {
    1: "bg-red-100 text-red-800",
    2: "bg-amber-100 text-amber-800",
    3: "bg-blue-100 text-blue-800",
    4: "bg-slate-100 text-slate-800",
    5: "bg-slate-100 text-slate-800",
  };

  const shouldUpdateColors = {
    Yes: "bg-emerald-100 text-emerald-800",
    Doubtful: "bg-amber-100 text-amber-800",
    "No - low value keys": "bg-slate-100 text-slate-600",
    "No - intent shifted": "bg-red-100 text-red-800",
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                priorityColors[result.priority as keyof typeof priorityColors] || priorityColors[5]
              }`}
            >
              P{result.priority}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                shouldUpdateColors[result.shouldUpdate]
              }`}
            >
              {result.shouldUpdate}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-muted">
              {result.estimatedEffort} effort
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                result.recoveryLikelihood === "High"
                  ? "bg-emerald-100 text-emerald-800"
                  : result.recoveryLikelihood === "Medium"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-100 text-slate-600"
              }`}
            >
              {result.recoveryLikelihood} recovery
            </span>
            {result.intentShifted && (
              <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                Intent shifted
              </span>
            )}
            {result.consolidateWith && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                Consolidate
              </span>
            )}
          </div>
          <div className="font-medium text-sm truncate">{slug}</div>
          <div className="text-xs text-muted mt-0.5">
            {result.updatePlanSummary}
          </div>
        </div>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`shrink-0 text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-border px-5 py-4 space-y-5">
          {/* Suggested title & meta */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted uppercase tracking-wide">
              Suggested Title & Meta
            </h4>
            <div className="rounded-lg bg-slate-50 p-3 space-y-1">
              <div className="text-sm font-medium text-blue-700">
                {result.suggestedTitle}
              </div>
              <div className="text-xs text-slate-600">
                {result.suggestedMeta}
              </div>
            </div>
          </div>

          {/* What's worse */}
          <div>
            <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
              Where your content falls short
              <HelpIcon tooltip="Specific areas where competitor pages are better than yours. These are the gaps causing your ranking decline." />
            </h4>
            <ul className="space-y-1.5">
              {result.worsePoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-red-500">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Strengths */}
          <div>
            <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
              Your strengths (keep these)
            </h4>
            <ul className="space-y-1.5">
              {result.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-emerald-500">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Update plan */}
          {result.whatToAddOrUpdate.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
                Recommended updates
                <HelpIcon tooltip="Specific sections to add or rewrite, with word count estimates and reasoning for each change." />
              </h4>
              <div className="space-y-3">
                {result.whatToAddOrUpdate.map((item, i) => (
                  <div key={i} className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                          item.action === "add"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.action.toUpperCase()}
                      </span>
                      <span className="font-medium text-sm">{item.section}</span>
                    </div>
                    <p className="text-sm text-slate-700 mb-1">{item.details}</p>
                    <p className="text-xs text-muted italic">{item.why}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Consolidation note */}
          {result.consolidateWith && (
            <InfoCallout variant="warning" title="Consolidation recommended">
              <p>
                This page shares keywords with{" "}
                <code className="bg-white/50 px-1 rounded text-xs">
                  {new URL(result.consolidateWith).pathname}
                </code>
                . Consider merging both articles into one comprehensive piece to
                eliminate cannibalization and consolidate ranking authority.
              </p>
            </InfoCallout>
          )}
        </div>
      )}
    </div>
  );
}

export function StepResults({ onBack }: { onBack: () => void }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  // Sort by priority
  const sortedResults = [...mockLLMResults].sort((a, b) => a.priority - b.priority);

  const yesCount = sortedResults.filter((r) => r.shouldUpdate === "Yes").length;
  const doubtfulCount = sortedResults.filter((r) => r.shouldUpdate === "Doubtful").length;
  const noCount = sortedResults.filter((r) => r.shouldUpdate.startsWith("No")).length;

  return (
    <div className="space-y-6">
      <InfoCallout title="How to use these results">
        <p>
          Each page below has been analyzed by comparing your content against the
          competitors that displaced you. The AI identified specific content gaps
          and produced an update plan. Pages are sorted by priority —{" "}
          <strong>P1 = highest impact, lowest effort</strong>. Focus on &quot;Yes&quot;
          recommendations first, review &quot;Doubtful&quot; ones for edge cases, and
          skip &quot;No&quot; unless you disagree with the reasoning.
        </p>
      </InfoCallout>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <div className="text-2xl font-bold">{sortedResults.length}</div>
          <div className="text-xs text-muted mt-1">Pages analyzed</div>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-700">{yesCount}</div>
          <div className="text-xs text-muted mt-1">Recommend update</div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
          <div className="text-2xl font-bold text-amber-700">{doubtfulCount}</div>
          <div className="text-xs text-muted mt-1">Doubtful</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
          <div className="text-2xl font-bold text-slate-500">{noCount}</div>
          <div className="text-xs text-muted mt-1">Skip</div>
        </div>
      </div>

      {/* Results list */}
      <div className="space-y-3">
        {sortedResults.map((result, i) => (
          <ResultCard
            key={result.candidateUrl}
            result={result}
            isExpanded={expandedIndex === i}
            onToggle={() => setExpandedIndex(expandedIndex === i ? null : i)}
          />
        ))}
      </div>

      {/* Download section */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="font-semibold mb-2">Export Report</h3>
        <p className="text-sm text-muted mb-4">
          Download the full audit as an Excel file with all data: GSC metrics,
          keyword analysis, competitor data, and AI recommendations in separate
          sheets.
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-white font-medium hover:bg-blue-700 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Download Excel (.xlsx)
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Download CSV
          </button>
        </div>
      </div>

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
      </div>
    </div>
  );
}
