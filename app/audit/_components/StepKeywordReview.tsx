"use client";

import { useState, useMemo } from "react";
import type { LostKeyword } from "@/lib/types";
import { InfoCallout } from "./InfoCallout";
import { HelpIcon } from "./Tooltip";

export function StepKeywordReview({
  onNext,
  onBack,
  keywords,
  onKeywordsUpdated,
}: {
  onNext: () => void;
  onBack: () => void;
  keywords: LostKeyword[];
  onKeywordsUpdated: (keywords: LostKeyword[]) => void;
}) {
  const [filterUrl, setFilterUrl] = useState<string>("all");
  const [showJunk, setShowJunk] = useState(true);

  const candidateUrls = useMemo(
    () =>
      [...new Set(keywords.map((k) => k.candidateUrl))].filter(
        (u) => u !== "unassigned"
      ),
    [keywords]
  );

  const hasKdData = useMemo(
    () => keywords.some((k) => k.kd != null),
    [keywords]
  );

  const filteredKeywords = useMemo(() => {
    let result = keywords;
    if (filterUrl !== "all") {
      result = result.filter((k) => k.candidateUrl === filterUrl);
    }
    if (!showJunk) {
      result = result.filter((k) => !k.isJunk);
    }
    return result;
  }, [keywords, filterUrl, showJunk]);

  const selectedCount = keywords.filter((k) => k.isSelected).length;
  const junkCount = keywords.filter((k) => k.isJunk).length;
  const unassignedCount = keywords.filter(
    (k) => k.candidateUrl === "unassigned"
  ).length;

  function toggleKeyword(keyword: string) {
    onKeywordsUpdated(
      keywords.map((k) =>
        k.keyword === keyword ? { ...k, isSelected: !k.isSelected } : k
      )
    );
  }

  function selectAllVisible() {
    const visibleKeywords = new Set(filteredKeywords.map((k) => k.keyword));
    onKeywordsUpdated(
      keywords.map((k) =>
        visibleKeywords.has(k.keyword) ? { ...k, isSelected: true } : k
      )
    );
  }

  function deselectAllVisible() {
    const visibleKeywords = new Set(filteredKeywords.map((k) => k.keyword));
    onKeywordsUpdated(
      keywords.map((k) =>
        visibleKeywords.has(k.keyword) ? { ...k, isSelected: false } : k
      )
    );
  }

  function getSlug(url: string): string {
    try {
      return new URL(url).pathname.split("/").pop() || url;
    } catch {
      return url;
    }
  }

  return (
    <div className="space-y-6">
      <InfoCallout title="How keyword scoring works">
        <p>
          Each keyword gets a <strong>Value Score</strong> based on:{" "}
          <code className="bg-white/50 px-1 rounded">
            (Volume &times; 0.4) + (|TrafficLoss| &times; 0.5) + (PosBefore
            &times; 0.1)
            {hasKdData ? " - (KD \u00d7 0.05)" : ""}
          </code>
          . Higher scores mean the keyword is high-volume, lost significant
          traffic, and is worth recovering. Keywords flagged as &quot;junk&quot;
          are auto-deselected but you can override this.
        </p>
      </InfoCallout>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="block text-xs text-muted mb-1">
            Filter by page
          </label>
          <select
            value={filterUrl}
            onChange={(e) => setFilterUrl(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <option value="all">
              All pages ({keywords.length} keywords)
            </option>
            {candidateUrls.map((url) => {
              const count = keywords.filter(
                (k) => k.candidateUrl === url
              ).length;
              return (
                <option key={url} value={url}>
                  {getSlug(url)} ({count})
                </option>
              );
            })}
            {unassignedCount > 0 && (
              <option value="unassigned">
                Unassigned ({unassignedCount})
              </option>
            )}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showJunk}
            onChange={() => setShowJunk(!showJunk)}
            className="accent-accent"
          />
          Show junk keywords ({junkCount})
        </label>
        <div className="ml-auto flex gap-2">
          <button
            onClick={selectAllVisible}
            className="text-xs text-accent hover:underline"
          >
            Select visible
          </button>
          <span className="text-muted">|</span>
          <button
            onClick={deselectAllVisible}
            className="text-xs text-accent hover:underline"
          >
            Deselect visible
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="rounded-lg bg-slate-50 px-4 py-2">
          <span className="text-muted">Total keywords:</span>{" "}
          <span className="font-semibold">{keywords.length}</span>
        </div>
        <div className="rounded-lg bg-blue-50 px-4 py-2">
          <span className="text-muted">Selected:</span>{" "}
          <span className="font-semibold text-accent">{selectedCount}</span>
        </div>
        <div className="rounded-lg bg-amber-50 px-4 py-2">
          <span className="text-muted">Marked junk:</span>{" "}
          <span className="font-semibold text-amber-700">{junkCount}</span>
        </div>
        {unassignedCount > 0 && (
          <div className="rounded-lg bg-orange-50 px-4 py-2">
            <span className="text-muted">Unassigned:</span>{" "}
            <span className="font-semibold text-orange-700">
              {unassignedCount}
            </span>
          </div>
        )}
      </div>

      {/* Keywords table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="px-3 py-2.5 w-10"></th>
              <th className="px-3 py-2.5 font-medium">Keyword</th>
              <th className="px-3 py-2.5 font-medium text-right">
                Volume
                <HelpIcon tooltip="Monthly search volume from Ahrefs. Higher = more potential traffic." />
              </th>
              {hasKdData && (
                <th className="px-3 py-2.5 font-medium text-right">
                  KD
                  <HelpIcon tooltip="Keyword Difficulty (0-100). Lower = easier to rank for. Above 65 is very competitive." />
                </th>
              )}
              <th className="px-3 py-2.5 font-medium text-right">
                Pos. Before
                <HelpIcon tooltip="Your position for this keyword before the decline." />
              </th>
              <th className="px-3 py-2.5 font-medium text-right">
                Pos. Now
                <HelpIcon tooltip="Your current position. 0 means you've dropped out of the top 100." />
              </th>
              <th className="px-3 py-2.5 font-medium text-right">
                Traffic Lost
                <HelpIcon tooltip="Estimated monthly organic visits lost due to the position change." />
              </th>
              <th className="px-3 py-2.5 font-medium text-right">
                Value Score
                <HelpIcon tooltip="Our composite score combining volume, traffic loss, and position. Higher = better recovery target." />
              </th>
              <th className="px-3 py-2.5 font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredKeywords.map((kw) => (
              <tr
                key={kw.keyword}
                className={`border-t border-border transition-colors ${
                  kw.isJunk
                    ? "bg-amber-50/30"
                    : kw.isSelected
                      ? "bg-blue-50/50"
                      : "hover:bg-slate-50/50"
                }`}
              >
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={kw.isSelected}
                    onChange={() => toggleKeyword(kw.keyword)}
                    className="accent-accent"
                  />
                </td>
                <td className="px-3 py-2.5">
                  <div className="font-medium">{kw.keyword}</div>
                  <div className="text-xs text-muted truncate max-w-[200px]">
                    {kw.candidateUrl === "unassigned" ? (
                      <span className="text-orange-600">Unassigned</span>
                    ) : (
                      getSlug(kw.candidateUrl)
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {kw.volume.toLocaleString()}
                </td>
                {hasKdData && (
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {kw.kd != null ? (
                      <span
                        className={
                          kw.kd > 65
                            ? "text-red-600"
                            : kw.kd > 40
                              ? "text-amber-600"
                              : "text-emerald-600"
                        }
                      >
                        {kw.kd}
                      </span>
                    ) : (
                      <span className="text-muted">&mdash;</span>
                    )}
                  </td>
                )}
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {kw.positionBefore.toFixed(1)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {kw.position === 0 ? (
                    <span className="text-red-600">Out</span>
                  ) : (
                    kw.position.toFixed(1)
                  )}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  <span className="text-red-600">
                    {kw.trafficChange.toLocaleString()}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums font-medium">
                  {kw.valueScore.toFixed(0)}
                </td>
                <td className="px-3 py-2.5 text-center">
                  {kw.isJunk ? (
                    <span
                      className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 cursor-help"
                      title={kw.junkReason || ""}
                    >
                      Junk
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      Keep
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Junk explanation */}
      <InfoCallout title="What are 'junk' keywords?">
        <p>
          We auto-flag keywords that are unlikely to be worth pursuing:
          {hasKdData && " very high KD (>65),"} very low volume (&lt;100), or
          brand terms for competitors. You can override these flags by
          checking/unchecking the box. Only selected keywords are sent to the LLM
          for analysis.
        </p>
      </InfoCallout>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </button>
        <button
          onClick={onNext}
          disabled={selectedCount === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Analysis ({selectedCount} keywords)
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
