"use client";

import type { ArticleKeyword } from "@/lib/types";

interface StepTargetKeywordProps {
  onNext: () => void;
  onBack: () => void;
  keywords: ArticleKeyword[];
  targetKeyword: string | null;
  onTargetKeywordSelected: (keyword: string | null) => void;
  articleUrl: string;
}

export function StepTargetKeyword({
  onNext,
  onBack,
  keywords,
  targetKeyword,
  onTargetKeywordSelected,
  articleUrl,
}: StepTargetKeywordProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted mb-2">Article:</p>
        <p className="text-sm font-mono break-all">{articleUrl}</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="font-semibold mb-2">Select Target Keyword</h3>
        <p className="text-sm text-muted">
          Choose the primary keyword you want to recover rankings for.
        </p>
        <p className="mt-4 text-xs text-muted italic">
          Full implementation coming in Phase 4C.
        </p>
        {keywords.length > 0 && (
          <div className="mt-4 max-h-60 overflow-y-auto space-y-1">
            {keywords.slice(0, 20).map((kw) => (
              <button
                key={kw.keyword}
                onClick={() => onTargetKeywordSelected(kw.keyword)}
                className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors ${
                  targetKeyword === kw.keyword
                    ? "bg-white/10 border border-white/20"
                    : "hover:bg-white/5"
                }`}
              >
                <span className="font-medium">{kw.keyword}</span>
                <span className="ml-2 text-muted">vol: {kw.volume}</span>
                <span className="ml-2 text-muted">pos: {kw.position}</span>
              </button>
            ))}
          </div>
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
          disabled={!targetKeyword}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
