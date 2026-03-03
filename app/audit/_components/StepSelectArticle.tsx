"use client";

import type { ArticleKeyword } from "@/lib/types";

interface StepSelectArticleProps {
  onNext: () => void;
  onBack: () => void;
  selectedArticleUrl: string;
  articleKeywords: ArticleKeyword[];
  onKeywordsParsed: (keywords: ArticleKeyword[]) => void;
}

export function StepSelectArticle({
  onNext,
  onBack,
  selectedArticleUrl,
  articleKeywords,
  onKeywordsParsed,
}: StepSelectArticleProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted mb-2">Selected article:</p>
        <p className="text-sm font-mono break-all">{selectedArticleUrl}</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="font-semibold mb-2">Upload Ahrefs Keywords</h3>
        <p className="text-sm text-muted">
          Upload an article-level Ahrefs &quot;Organic Keywords&quot; export for this URL.
          This should contain ranking and lost keywords with position changes.
        </p>
        <p className="mt-4 text-xs text-muted italic">
          Full implementation coming in Phase 4B.
        </p>
        {articleKeywords.length > 0 && (
          <p className="mt-2 text-sm text-green-400">
            {articleKeywords.length} keywords loaded.
          </p>
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
          disabled={articleKeywords.length === 0}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
