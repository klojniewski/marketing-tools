"use client";

import { useState } from "react";
import { InfoCallout } from "./InfoCallout";
import { HelpIcon } from "./Tooltip";

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

export function StepConfigurePeriods({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>("90d");
  const [impressionThreshold, setImpressionThreshold] = useState(500);
  const [clicksDropThreshold, setClicksDropThreshold] = useState(20);
  const [blogUrlPattern, setBlogUrlPattern] = useState("/blog/");
  const [topicPatterns, setTopicPatterns] = useState(
    "headless cms, sanity, nextjs, react, seo, content, migration"
  );

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
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          Fetch GSC Data
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
