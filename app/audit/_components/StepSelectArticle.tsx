"use client";

import { useState, useRef, useCallback } from "react";
import type { ArticleKeyword } from "@/lib/types";
import { parseAhrefsCSV, type ParsedCSV } from "@/lib/ahrefs/parse-csv";
import {
  transformArticleKeywords,
  getArticleKeywordStats,
  type ArticleKeywordStats,
} from "@/lib/ahrefs/transform-article-keywords";
import { InfoCallout } from "./InfoCallout";

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
  const [fileName, setFileName] = useState<string | null>(null);
  const [stats, setStats] = useState<ArticleKeywordStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasKeywords = articleKeywords.length > 0;

  const processFile = useCallback(
    async (file: File) => {
      setParsing(true);
      setError(null);

      try {
        const parsed: ParsedCSV = await parseAhrefsCSV(file);

        if (
          parsed.fileType !== "article-keywords" &&
          parsed.fileType !== "organic-keywords"
        ) {
          setError(
            `"${file.name}" doesn't look like an Ahrefs Organic Keywords export. Expected columns like "Keyword", "Volume", "Current position", "URL".`
          );
          setParsing(false);
          return;
        }

        if (parsed.rowCount === 0) {
          setError(`"${file.name}" has headers but no data rows.`);
          setParsing(false);
          return;
        }

        const keywords = transformArticleKeywords(
          parsed.rows,
          selectedArticleUrl
        );

        if (keywords.length === 0) {
          setError(
            `No keywords found matching your selected article URL. Make sure you exported keywords for: ${selectedArticleUrl}`
          );
          setParsing(false);
          return;
        }

        onKeywordsParsed(keywords);
        setStats(getArticleKeywordStats(keywords));
        setFileName(parsed.fileName);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to parse CSV file"
        );
      } finally {
        setParsing(false);
      }
    },
    [selectedArticleUrl, onKeywordsParsed]
  );

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const file = fileList[0];
      if (!file) return;
      if (!file.name.endsWith(".csv")) {
        setError(`"${file.name}" is not a CSV file.`);
        return;
      }
      processFile(file);
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  function handleClear() {
    onKeywordsParsed([]);
    setStats(null);
    setFileName(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      {/* Selected article */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs text-muted mb-1">Analyzing article:</p>
        <p className="text-sm font-mono break-all">{selectedArticleUrl}</p>
      </div>

      {/* Instructions */}
      <InfoCallout title="How to export from Ahrefs">
        <p>
          In Ahrefs Site Explorer, enter your <strong>article URL</strong> (not
          your domain) &rarr; <strong>Organic Keywords</strong> &rarr; compare
          to previous period &rarr; <strong>Export CSV</strong>. This gives
          per-keyword position changes, traffic, and volume data.
        </p>
      </InfoCallout>

      {/* Upload area */}
      {!hasKeywords ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
            isDragging
              ? "border-white/40 bg-white/5"
              : "border-border hover:border-white/20"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
            {parsing ? (
              <svg
                className="animate-spin text-white/60"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-muted"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
            )}
          </div>
          <p className="text-sm font-medium mb-1">
            {parsing
              ? "Parsing CSV..."
              : "Drop Ahrefs CSV here, or click to browse"}
          </p>
          <p className="text-xs text-muted">
            Article-level Organic Keywords export (.csv)
          </p>
        </div>
      ) : (
        /* Upload success summary */
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-green-900/30">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-green-400"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">{fileName}</p>
                <p className="text-xs text-muted">
                  {stats?.total} keywords imported
                </p>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="text-xs text-muted hover:text-red-400 transition-colors"
            >
              Remove
            </button>
          </div>

          {/* Stats grid */}
          {stats && (
            <div className="grid grid-cols-5 gap-3">
              <div className="rounded-md bg-white/5 p-3 text-center">
                <p className="text-lg font-bold">{stats.total}</p>
                <p className="text-xs text-muted">Total</p>
              </div>
              <div className="rounded-md bg-white/5 p-3 text-center">
                <p className="text-lg font-bold text-green-400">
                  {stats.ranking}
                </p>
                <p className="text-xs text-muted">Ranking</p>
              </div>
              <div className="rounded-md bg-white/5 p-3 text-center">
                <p className="text-lg font-bold text-yellow-400">
                  {stats.declined}
                </p>
                <p className="text-xs text-muted">Declined</p>
              </div>
              <div className="rounded-md bg-white/5 p-3 text-center">
                <p className="text-lg font-bold text-red-400">{stats.lost}</p>
                <p className="text-xs text-muted">Lost</p>
              </div>
              <div className="rounded-md bg-white/5 p-3 text-center">
                <p className="text-lg font-bold text-blue-400">
                  {stats.newKeywords}
                </p>
                <p className="text-xs text-muted">New</p>
              </div>
            </div>
          )}

          {stats && (
            <p className="mt-3 text-xs text-muted">
              Avg. position change:{" "}
              <span
                className={
                  stats.avgPositionChange >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }
              >
                {stats.avgPositionChange >= 0 ? "+" : ""}
                {stats.avgPositionChange}
              </span>
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <InfoCallout variant="danger" title="Import error">
          <p>{error}</p>
        </InfoCallout>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          onClick={onBack}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-card"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!hasKeywords}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-40"
        >
          Next: Select Target Keyword
        </button>
      </div>
    </div>
  );
}
