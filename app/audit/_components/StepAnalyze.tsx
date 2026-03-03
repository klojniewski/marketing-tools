"use client";

import type { ArticleKeyword, ManualCompetitor, ArticleAnalysis } from "@/lib/types";

interface StepAnalyzeProps {
  onBack: () => void;
  articleUrl: string;
  targetKeyword: string;
  articleKeywords: ArticleKeyword[];
  competitors: ManualCompetitor[];
  analysisResult: ArticleAnalysis | null;
  onAnalysisComplete: (result: ArticleAnalysis) => void;
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
  return (
    <div className="space-y-6">
      {/* Summary of inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted mb-1">Article</p>
          <p className="text-sm font-mono break-all">{articleUrl}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted mb-1">Target keyword</p>
          <p className="text-sm font-semibold">{targetKeyword}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted mb-1">Keywords</p>
          <p className="text-sm">{articleKeywords.length} loaded</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted mb-1">Competitors</p>
          <p className="text-sm">{competitors.length} URLs</p>
        </div>
      </div>

      {!analysisResult ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <h3 className="font-semibold mb-2">AI Analysis</h3>
          <p className="text-sm text-muted mb-4">
            This will analyze your article against competitors using AI to produce
            diagnosis, competitor comparison, and actionable recommendations.
          </p>
          <p className="text-xs text-muted italic">
            Full implementation coming in Phase 4D/4E.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold mb-2">Analysis Complete</h3>
          <pre className="text-xs overflow-auto max-h-96">
            {JSON.stringify(analysisResult, null, 2)}
          </pre>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-card"
        >
          Back
        </button>
      </div>
    </div>
  );
}
