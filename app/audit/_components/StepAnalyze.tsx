"use client";

import { useState, useCallback, useEffect } from "react";
import type {
  ArticleKeyword,
  ManualCompetitor,
  ArticleAnalysis,
} from "@/lib/types";

interface StepAnalyzeProps {
  onBack: () => void;
  articleUrl: string;
  targetKeyword: string;
  articleKeywords: ArticleKeyword[];
  competitors: ManualCompetitor[];
  analysisResult: ArticleAnalysis | null;
  onAnalysisComplete: (result: ArticleAnalysis) => void;
}

type AnalysisStage =
  | "idle"
  | "fetching-article"
  | "fetching-competitors"
  | "analyzing"
  | "complete"
  | "error";

const STAGE_LABELS: Record<AnalysisStage, string> = {
  idle: "Ready to analyze",
  "fetching-article": "Fetching article content...",
  "fetching-competitors": "Fetching competitor content...",
  analyzing: "Running AI analysis...",
  complete: "Analysis complete",
  error: "Analysis failed",
};

// ── Priority badge colors ───────────────────────────────────────────────
function priorityColor(p: string) {
  switch (p) {
    case "high":
      return "bg-red-100 text-red-700";
    case "medium":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
}

function categoryLabel(c: string) {
  const labels: Record<string, string> = {
    "heading-restructure": "Headings",
    "missing-content": "Content Gap",
    faq: "FAQ",
    "featured-snippet": "Snippet",
    tldr: "TL;DR",
    "cross-linking": "Links",
    "meta-tags": "Meta",
    eeat: "E-E-A-T",
    aeo: "AEO",
  };
  return labels[c] || c;
}

function categoryColor(c: string) {
  const colors: Record<string, string> = {
    "heading-restructure": "bg-purple-100 text-purple-700",
    "missing-content": "bg-orange-100 text-orange-700",
    faq: "bg-cyan-100 text-cyan-700",
    "featured-snippet": "bg-emerald-100 text-emerald-700",
    tldr: "bg-indigo-100 text-indigo-700",
    "cross-linking": "bg-blue-100 text-blue-700",
    "meta-tags": "bg-pink-100 text-pink-700",
    eeat: "bg-amber-100 text-amber-700",
    aeo: "bg-teal-100 text-teal-700",
  };
  return colors[c] || "bg-slate-100 text-slate-700";
}

export function StepAnalyze({
  onBack,
  articleUrl,
  targetKeyword,
  articleKeywords,
  competitors,
  analysisResult,
  onAnalysisComplete,
}: StepAnalyzeProps) {
  const [stage, setStage] = useState<AnalysisStage>(
    analysisResult ? "complete" : "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const runAnalysis = useCallback(async () => {
    setStage("fetching-article");
    setError(null);

    // Simulate brief stages for UX (the API does all fetching internally)
    setTimeout(() => setStage("fetching-competitors"), 1500);
    setTimeout(() => setStage("analyzing"), 3000);

    try {
      const res = await fetch("/api/audit/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleUrl,
          targetKeyword,
          keywords: articleKeywords,
          competitors,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      onAnalysisComplete(data.analysis);
      setStage("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setStage("error");
    }
  }, [articleUrl, targetKeyword, articleKeywords, competitors, onAnalysisComplete]);

  // Auto-start if no result yet
  useEffect(() => {
    if (!analysisResult && stage === "idle") {
      runAnalysis();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Processing UI ──────────────────────────────────────────────
  if (!analysisResult && stage !== "error") {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-border bg-card p-8">
          <div className="flex flex-col items-center text-center">
            <svg
              className="animate-spin mb-4"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            <h3 className="font-semibold mb-1">{STAGE_LABELS[stage]}</h3>
            <p className="text-sm text-muted">
              This may take 30-60 seconds depending on the number of
              competitors.
            </p>

            {/* Progress steps */}
            <div className="mt-6 w-full max-w-sm space-y-2">
              {(
                [
                  "fetching-article",
                  "fetching-competitors",
                  "analyzing",
                ] as const
              ).map((s) => {
                const stageOrder = [
                  "idle",
                  "fetching-article",
                  "fetching-competitors",
                  "analyzing",
                  "complete",
                ];
                const current = stageOrder.indexOf(stage);
                const target = stageOrder.indexOf(s);
                const isDone = current > target;
                const isActive = current === target;

                return (
                  <div
                    key={s}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-accent/10 text-accent font-medium"
                        : isDone
                        ? "text-green-600"
                        : "text-muted"
                    }`}
                  >
                    {isDone ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-green-600"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : isActive ? (
                      <svg
                        className="animate-spin"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                      </svg>
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-muted" />
                    )}
                    {STAGE_LABELS[s]}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error UI ───────────────────────────────────────────────────
  if (stage === "error") {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-red-900/50 bg-red-900/10 p-6">
          <h3 className="font-semibold text-red-600 mb-2">Analysis Failed</h3>
          <p className="text-sm text-muted">{error}</p>
          <button
            onClick={runAnalysis}
            className="mt-4 rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
          >
            Retry Analysis
          </button>
        </div>
        <button
          onClick={onBack}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-card"
        >
          Back
        </button>
      </div>
    );
  }

  // ── Results UI ─────────────────────────────────────────────────
  const result = analysisResult!;

  return (
    <div className="space-y-6">
      {/* Header badges */}
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            result.recoveryLikelihood === "High"
              ? "bg-green-100 text-green-400"
              : result.recoveryLikelihood === "Medium"
              ? "bg-yellow-100 text-yellow-600"
              : "bg-red-100 text-red-600"
          }`}
        >
          Recovery: {result.recoveryLikelihood}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
          Effort: {result.estimatedEffort}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
          {result.recommendations.length} recommendations
        </span>
      </div>

      {/* Suggested Meta */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div>
          <p className="text-xs text-muted mb-1">Suggested Title</p>
          <p className="text-sm font-medium">{result.suggestedTitle}</p>
        </div>
        <div>
          <p className="text-xs text-muted mb-1">Suggested Meta Description</p>
          <p className="text-sm">{result.suggestedMeta}</p>
        </div>
      </div>

      {/* Section A: Diagnosis */}
      <section>
        <h3 className="text-lg font-bold mb-3">A. Position Loss Diagnosis</h3>
        <div className="rounded-lg border border-border bg-card p-4 mb-4">
          <p className="text-sm">{result.diagnosis.summary}</p>
        </div>

        {/* Keyword Clusters */}
        {result.diagnosis.keywordClusters.length > 0 && (
          <div className="rounded-lg border border-border bg-card overflow-hidden mb-4">
            <div className="px-4 py-2 border-b border-border">
              <h4 className="text-sm font-semibold">Keyword Clusters</h4>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted border-b border-border">
                  <th className="text-left px-4 py-2">Cluster</th>
                  <th className="text-left px-4 py-2">Keywords</th>
                  <th className="text-right px-4 py-2">Avg Change</th>
                  <th className="text-center px-4 py-2">Trend</th>
                </tr>
              </thead>
              <tbody>
                {result.diagnosis.keywordClusters.map((c) => (
                  <tr
                    key={c.cluster}
                    className="border-b border-border/50"
                  >
                    <td className="px-4 py-2 font-medium">{c.cluster}</td>
                    <td className="px-4 py-2 text-muted">
                      {c.keywords.join(", ")}
                    </td>
                    <td
                      className={`px-4 py-2 text-right tabular-nums ${
                        c.avgPositionChange < 0
                          ? "text-red-600"
                          : "text-green-400"
                      }`}
                    >
                      {c.avgPositionChange > 0 ? "+" : ""}
                      {c.avgPositionChange}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                          c.trend === "declining"
                            ? "bg-red-100 text-red-600"
                            : c.trend === "improving"
                            ? "bg-green-100 text-green-400"
                            : "bg-slate-100 text-muted"
                        }`}
                      >
                        {c.trend}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Intent Analysis */}
        <div
          className={`rounded-lg border p-4 mb-4 ${
            result.diagnosis.intentAnalysis.mismatchDetected
              ? "border-yellow-900/50 bg-yellow-900/10"
              : "border-border bg-card"
          }`}
        >
          <h4 className="text-sm font-semibold mb-1">
            Intent Analysis
            {result.diagnosis.intentAnalysis.mismatchDetected && (
              <span className="ml-2 text-yellow-600 text-xs font-normal">
                Mismatch detected
              </span>
            )}
          </h4>
          <p className="text-sm text-muted">
            {result.diagnosis.intentAnalysis.explanation}
          </p>
        </div>

        {/* Topical Gaps */}
        {result.diagnosis.topicalGaps.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4 mb-4">
            <h4 className="text-sm font-semibold mb-2">Topical Gaps</h4>
            <ul className="space-y-1">
              {result.diagnosis.topicalGaps.map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-red-600 mt-0.5">-</span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* EEAT Issues */}
        {result.diagnosis.eeatIssues.length > 0 && (
          <div className="rounded-lg border border-yellow-900/50 bg-yellow-900/10 p-4 mb-4">
            <h4 className="text-sm font-semibold mb-2">E-E-A-T Issues</h4>
            <ul className="space-y-1">
              {result.diagnosis.eeatIssues.map((e, i) => (
                <li key={i} className="text-sm">
                  {e}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Section B: Competitor Analysis */}
      <section>
        <h3 className="text-lg font-bold mb-3">
          B. Competitor Strength Analysis
        </h3>

        {/* Tabs */}
        {result.competitorAnalysis.length > 1 && (
          <div className="flex gap-1 mb-4 overflow-x-auto">
            {result.competitorAnalysis.map((c, i) => (
              <button
                key={c.url}
                onClick={() => setActiveTab(i)}
                className={`rounded-md px-3 py-1.5 text-xs whitespace-nowrap transition-colors ${
                  activeTab === i
                    ? "bg-accent text-white"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Competitor {i + 1}
              </button>
            ))}
          </div>
        )}

        {result.competitorAnalysis[activeTab] && (
          <CompetitorCard comp={result.competitorAnalysis[activeTab]} />
        )}
      </section>

      {/* Section C: Recommendations */}
      <section>
        <h3 className="text-lg font-bold mb-3">C. Update Recommendations</h3>
        <div className="space-y-3">
          {result.recommendations
            .sort((a, b) => {
              const order = { high: 0, medium: 1, low: 2 };
              return order[a.priority] - order[b.priority];
            })
            .map((rec, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${categoryColor(
                      rec.category
                    )}`}
                  >
                    {categoryLabel(rec.category)}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityColor(
                      rec.priority
                    )}`}
                  >
                    {rec.priority}
                  </span>
                </div>
                <h4 className="font-semibold text-sm mb-1">{rec.title}</h4>
                <p className="text-sm mb-2">{rec.details}</p>
                <p className="text-xs text-muted italic">{rec.rationale}</p>
              </div>
            ))}
        </div>
      </section>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          onClick={onBack}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-card"
        >
          Back
        </button>
        <button
          onClick={(e) => {
            navigator.clipboard.writeText(
              JSON.stringify(result, null, 2)
            );
            const btn = e.currentTarget;
            const original = btn.textContent;
            btn.textContent = "Copied!";
            setTimeout(() => {
              btn.textContent = original;
            }, 2000);
          }}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-card"
        >
          Copy JSON
        </button>
      </div>
    </div>
  );
}

// ── Competitor Card sub-component ────────────────────────────────
function CompetitorCard({
  comp,
}: {
  comp: ArticleAnalysis["competitorAnalysis"][0];
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div>
        <p className="text-xs text-muted mb-1">URL</p>
        <p className="text-sm font-mono break-all">{comp.url}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted mb-1">Meta Title</p>
          <p className="text-sm">{comp.metaTitle}</p>
        </div>
        <div>
          <p className="text-xs text-muted mb-1">Meta Description</p>
          <p className="text-sm">{comp.metaDescription}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
          {comp.internalLinkCount} internal links
        </span>
        {comp.hasFAQ && (
          <span className="rounded-full bg-cyan-900/30 px-2 py-0.5 text-xs text-cyan-400">
            Has FAQ
          </span>
        )}
        {comp.hasTLDR && (
          <span className="rounded-full bg-indigo-900/30 px-2 py-0.5 text-xs text-indigo-400">
            Has TL;DR
          </span>
        )}
      </div>

      {/* Heading structure */}
      {comp.headingStructure.length > 0 && (
        <div>
          <p className="text-xs text-muted mb-2">Heading Structure</p>
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {comp.headingStructure.map((h, i) => (
              <div
                key={i}
                className="text-xs"
                style={{ paddingLeft: `${(parseInt(h.tag[1]) - 1) * 12}px` }}
              >
                <span className="text-muted">{h.tag}:</span> {h.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing subtopics */}
      {comp.missingFromOurs.length > 0 && (
        <div>
          <p className="text-xs text-muted mb-2">
            Subtopics Missing From Your Article
          </p>
          <ul className="space-y-1">
            {comp.missingFromOurs.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-red-600 mt-0.5">+</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Strengths */}
      {comp.contentStrengths.length > 0 && (
        <div>
          <p className="text-xs text-muted mb-2">Content Strengths</p>
          <ul className="space-y-1">
            {comp.contentStrengths.map((s, i) => (
              <li key={i} className="text-sm text-muted">
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
