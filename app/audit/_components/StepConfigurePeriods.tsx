"use client";

import { useState, useEffect } from "react";
import { InfoCallout } from "./InfoCallout";
import { HelpIcon } from "./Tooltip";
import type { AuditConfig, GSCCandidate } from "@/lib/types";
import { computeDateRanges } from "@/lib/gsc/date-ranges";

type ComparisonMode = "28d" | "90d" | "yoy";

const COMPARISON_MODES: { value: ComparisonMode; label: string; description: string }[] = [
  {
    value: "28d",
    label: "Last 28 days vs previous 28 days",
    description: "Good for spotting recent drops. May include seasonal noise.",
  },
  {
    value: "90d",
    label: "Last 90 days vs previous 90 days",
    description: "Smooths out short-term fluctuations. Best for most audits.",
  },
  {
    value: "yoy",
    label: "Year over year (same period, last year)",
    description: "Eliminates seasonal bias. Requires 12+ months of data.",
  },
];

interface StepConfigurePeriodsProps {
  onNext: () => void;
  onBack: () => void;
  siteUrl: string;
  candidates: GSCCandidate[];
  onCandidatesFetched: (candidates: GSCCandidate[]) => void;
}

export function StepConfigurePeriods({
  onNext,
  onBack,
  siteUrl,
  candidates,
  onCandidatesFetched,
}: StepConfigurePeriodsProps) {
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>("90d");
  const [impressionThreshold, setImpressionThreshold] = useState(500);
  const [clicksDropThreshold, setClicksDropThreshold] = useState(20);
  const [blogUrlPattern, setBlogUrlPattern] = useState("/blog/");
  const [topicPatterns, setTopicPatterns] = useState(
    "headless cms, sanity, nextjs, react, seo, content, migration"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(candidates.length > 0);
  const [usingMock, setUsingMock] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());

  // Auto-select important pages when candidates change
  useEffect(() => {
    if (candidates.length > 0) {
      setSelectedUrls(
        new Set(
          candidates
            .filter((c) => c.isImportant && c.clicksDiffPercent < -20)
            .map((c) => c.url)
        )
      );
    }
  }, [candidates]);

  async function handleFetchData() {
    setIsLoading(true);
    setError(null);

    try {
      const ranges = computeDateRanges(comparisonMode);

      const config: AuditConfig = {
        siteUrl,
        periodAStart: ranges.periodA.startDate,
        periodAEnd: ranges.periodA.endDate,
        periodBStart: ranges.periodB.startDate,
        periodBEnd: ranges.periodB.endDate,
        comparisonMode,
        impressionThreshold,
        clicksDropThreshold,
        blogUrlPattern,
        topicPatterns,
      };

      const res = await fetch("/api/gsc/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to query GSC");
      }

      const data = await res.json();
      onCandidatesFetched(data.candidates);
      setHasFetched(true);
      setUsingMock(false);
    } catch (err) {
      console.error("Error fetching GSC data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch GSC data"
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleSkipWithMock() {
    import("@/lib/mock-data").then(({ mockCandidates }) => {
      onCandidatesFetched(mockCandidates);
      setHasFetched(true);
      setUsingMock(true);
    });
  }

  function toggleUrl(url: string) {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }

  function selectAll() {
    setSelectedUrls(new Set(candidates.map((c) => c.url)));
  }

  function selectNone() {
    setSelectedUrls(new Set());
  }

  type SortKey = "url" | "clicksA" | "clicksB" | "clicksChange" | "impA" | "impB" | "impChange" | "posA" | "posShift";
  const [sortKey, setSortKey] = useState<SortKey>("clicksChange");
  const [sortAsc, setSortAsc] = useState(true);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === "url");
    }
  }

  function getSortValue(c: GSCCandidate, key: SortKey): number | string {
    switch (key) {
      case "url": try { return new URL(c.url).pathname; } catch { return c.url; }
      case "clicksA": return c.clicksA;
      case "clicksB": return c.clicksB;
      case "clicksChange": return c.clicksDiffPercent;
      case "impA": return c.impressionsA;
      case "impB": return c.impressionsB;
      case "impChange": return c.impressionsB === 0 ? 0 : ((c.impressionsA - c.impressionsB) / c.impressionsB) * 100;
      case "posA": return c.positionA;
      case "posShift": return c.positionDiff;
    }
  }

  const sortedCandidates = [...candidates].sort((a, b) => {
    const va = getSortValue(a, sortKey);
    const vb = getSortValue(b, sortKey);
    const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
    return sortAsc ? cmp : -cmp;
  });

  const canProceed = candidates.length > 0 && selectedUrls.size > 0;

  return (
    <div className="space-y-6">
      <InfoCallout title="How do comparison periods work?">
        <p>
          We fetch your GSC data for two time windows and compare them. Pages
          where clicks or impressions dropped significantly between Period B
          (older) and Period A (recent) are flagged as declining. The thresholds
          below control what counts as &quot;significant.&quot;
        </p>
      </InfoCallout>

      {/* Comparison mode */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Comparison Window
          <HelpIcon tooltip="How far back to look. Longer windows reduce noise but may miss recent changes." />
        </label>
        <div className="space-y-2">
          {COMPARISON_MODES.map((mode) => (
            <label
              key={mode.value}
              className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                comparisonMode === mode.value
                  ? "border-accent bg-blue-50"
                  : "border-border bg-card hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="comparison-mode"
                value={mode.value}
                checked={comparisonMode === mode.value}
                onChange={() => setComparisonMode(mode.value)}
                className="accent-accent mt-0.5"
              />
              <div>
                <div className="font-medium text-sm">{mode.label}</div>
                <div className="text-xs text-muted mt-0.5">{mode.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Thresholds */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">
            Min. Impressions (Period B)
            <HelpIcon tooltip="Pages with fewer impressions than this in the baseline period are excluded. This filters out low-traffic pages that aren't worth auditing." />
          </label>
          <p className="text-xs text-muted mb-2">
            Only include pages that had at least this many impressions in the
            older period.
          </p>
          <input
            type="number"
            value={impressionThreshold}
            onChange={(e) => setImpressionThreshold(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Min. Clicks Drop (%)
            <HelpIcon tooltip="The minimum percentage decrease in clicks to flag a page as declining. 20% is a good default — lower catches more pages but adds noise." />
          </label>
          <p className="text-xs text-muted mb-2">
            Flag pages where clicks dropped by more than this percentage.
          </p>
          <div className="relative">
            <input
              type="number"
              value={clicksDropThreshold}
              onChange={(e) => setClicksDropThreshold(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">%</span>
          </div>
        </div>
      </div>

      {/* URL filter */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Blog URL Pattern
          <HelpIcon tooltip="A substring to match blog URLs. Only pages whose URL contains this pattern will be included. For most sites, '/blog/' works well." />
        </label>
        <p className="text-xs text-muted mb-2">
          We&apos;ll only analyze pages whose URL contains this string. This filters
          out non-blog pages like product pages, docs, etc.
        </p>
        <input
          type="text"
          value={blogUrlPattern}
          onChange={(e) => setBlogUrlPattern(e.target.value)}
          placeholder="/blog/"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        />
      </div>

      {/* Topic patterns */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Important Topics (comma-separated)
          <HelpIcon tooltip="Pages matching these topics are flagged as 'important' in the results. This helps you prioritize — a drop on a core-business topic matters more than a drop on a tangential one." />
        </label>
        <p className="text-xs text-muted mb-2">
          Pages matching these keywords will be marked as &quot;important&quot; so you can
          prioritize them. Matches are checked against the URL slug and page
          title.
        </p>
        <textarea
          value={topicPatterns}
          onChange={(e) => setTopicPatterns(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        />
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Fetch button row */}
      <div className="flex items-center gap-3 justify-end">
        <button
          onClick={handleSkipWithMock}
          disabled={isLoading}
          className="text-xs text-muted hover:text-slate-600 underline disabled:opacity-50"
        >
          Skip with mock data
        </button>
        <button
          onClick={handleFetchData}
          disabled={isLoading || !siteUrl}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Fetching GSC Data...
            </>
          ) : (
            hasFetched ? "Re-fetch GSC Data" : "Fetch GSC Data"
          )}
        </button>
      </div>

      {/* ─── Results section (appears after first fetch) ─── */}
      {candidates.length > 0 && (
        <>
          <hr className="border-border" />

          {usingMock && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-amber-800 text-xs">
              Showing mock data — connect GSC to see real results.
            </div>
          )}

          {/* Summary bar */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="rounded-lg bg-slate-50 px-4 py-2">
              <span className="text-muted">Pages found:</span>{" "}
              <span className="font-semibold">{candidates.length}</span>
            </div>
            <div className="rounded-lg bg-blue-50 px-4 py-2">
              <span className="text-muted">Selected:</span>{" "}
              <span className="font-semibold text-accent">{selectedUrls.size}</span>
            </div>
            <div className="rounded-lg bg-emerald-50 px-4 py-2">
              <span className="text-muted">Important:</span>{" "}
              <span className="font-semibold text-emerald-700">
                {candidates.filter((c) => c.isImportant).length}
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
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-2 py-2 w-8"></th>
                  <SortHeader label="URL" sortKey="url" currentKey={sortKey} asc={sortAsc} onSort={handleSort} />
                  <SortHeader label="Clicks A" sortKey="clicksA" currentKey={sortKey} asc={sortAsc} onSort={handleSort} align="right" tooltip="Clicks in the recent period (Period A)." />
                  <SortHeader label="Clicks B" sortKey="clicksB" currentKey={sortKey} asc={sortAsc} onSort={handleSort} align="right" tooltip="Clicks in the baseline period (Period B)." />
                  <SortHeader label="Clicks %" sortKey="clicksChange" currentKey={sortKey} asc={sortAsc} onSort={handleSort} align="right" tooltip="Percentage change in clicks from B → A. Negative means declining." />
                  <SortHeader label="Imp. A" sortKey="impA" currentKey={sortKey} asc={sortAsc} onSort={handleSort} align="right" tooltip="Impressions in the recent period (Period A)." />
                  <SortHeader label="Imp. B" sortKey="impB" currentKey={sortKey} asc={sortAsc} onSort={handleSort} align="right" tooltip="Impressions in the baseline period (Period B)." />
                  <SortHeader label="Imp. %" sortKey="impChange" currentKey={sortKey} asc={sortAsc} onSort={handleSort} align="right" tooltip="Percentage change in impressions from B → A. Negative means declining." />
                  <SortHeader label="Pos." sortKey="posA" currentKey={sortKey} asc={sortAsc} onSort={handleSort} align="right" tooltip="Average position in the recent period. Higher = further down in results." />
                  <SortHeader label={"Pos. \u0394"} sortKey="posShift" currentKey={sortKey} asc={sortAsc} onSort={handleSort} align="right" tooltip="Position change. Positive (red) = dropped in rankings." />
                  <th className="px-2 py-2 font-medium text-center whitespace-nowrap">
                    Flags
                    <HelpIcon tooltip="Imp = matches your topic keywords. Can = another page on your site competes for the same query." />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedCandidates.map((candidate) => {
                  const isSelected = selectedUrls.has(candidate.url);
                  let slug: string;
                  try {
                    slug = new URL(candidate.url).pathname;
                  } catch {
                    slug = candidate.url;
                  }
                  const impChangePercent = candidate.impressionsB === 0
                    ? 0
                    : ((candidate.impressionsA - candidate.impressionsB) / candidate.impressionsB) * 100;

                  return (
                    <tr
                      key={candidate.url}
                      className={`border-t border-border transition-colors ${
                        isSelected ? "bg-blue-50/50" : "hover:bg-slate-50/50"
                      }`}
                    >
                      <td className="px-2 py-1.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleUrl(candidate.url)}
                          className="accent-accent"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <a
                          href={candidate.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline truncate block max-w-[200px]"
                          title={candidate.url}
                        >
                          {slug}
                        </a>
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">
                        {candidate.clicksA.toLocaleString()}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">
                        {candidate.clicksB.toLocaleString()}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">
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
                      <td className="px-2 py-1.5 text-right tabular-nums">
                        {candidate.impressionsA.toLocaleString()}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">
                        {candidate.impressionsB.toLocaleString()}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">
                        <span
                          className={
                            impChangePercent < -50
                              ? "text-red-600 font-medium"
                              : impChangePercent < -20
                                ? "text-amber-600"
                                : "text-slate-600"
                          }
                        >
                          {impChangePercent > 0 ? "+" : ""}
                          {impChangePercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">
                        {candidate.positionA.toFixed(1)}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">
                        {candidate.positionDiff > 0 ? (
                          <span className="text-red-600">+{candidate.positionDiff.toFixed(1)}</span>
                        ) : (
                          <span className="text-emerald-600">{candidate.positionDiff.toFixed(1)}</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {candidate.isImportant && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-800">
                              Imp
                            </span>
                          )}
                          {candidate.hasCannibalization && (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800" title={`Competing with: ${candidate.cannibalizingUrl}`}>
                              Can
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
          {candidates.some((c) => c.hasCannibalization) && (
            <InfoCallout variant="warning" title="Cannibalization detected">
              <p>
                One or more pages are competing with another page on your site for
                the same keywords. This splits your ranking authority and can hurt
                both pages. In the results, we&apos;ll recommend whether to consolidate
                these pages.
              </p>
            </InfoCallout>
          )}
        </>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
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

function SortHeader({
  label,
  sortKey,
  currentKey,
  asc,
  onSort,
  align = "left",
  tooltip,
}: {
  label: string;
  sortKey: string;
  currentKey: string;
  asc: boolean;
  onSort: (key: never) => void;
  align?: "left" | "right";
  tooltip?: string;
}) {
  const active = currentKey === sortKey;
  return (
    <th
      className={`px-2 py-2 font-medium whitespace-nowrap cursor-pointer select-none hover:bg-slate-100 transition-colors ${
        align === "right" ? "text-right" : "text-left"
      }`}
      onClick={() => onSort(sortKey as never)}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        {tooltip && <HelpIcon tooltip={tooltip} />}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          className={active ? "text-slate-700" : "text-slate-300"}
        >
          <path
            d="M6 2L9 5H3L6 2Z"
            fill={active && asc ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="0.5"
          />
          <path
            d="M6 10L3 7H9L6 10Z"
            fill={active && !asc ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="0.5"
          />
        </svg>
      </span>
    </th>
  );
}
