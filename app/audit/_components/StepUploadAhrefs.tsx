"use client";

import { useState, useRef, useCallback } from "react";
import type { LostKeyword, ParsedBacklink } from "@/lib/types";
import { parseAhrefsCSV, type ParsedCSV } from "@/lib/ahrefs/parse-csv";
import {
  transformToKeywords,
  getMatchStats,
  type KeywordMatchStats,
} from "@/lib/ahrefs/transform-keywords";
import {
  transformToBacklinks,
  getBacklinkStats,
  type BacklinkStats,
} from "@/lib/ahrefs/transform-backlinks";
import { mockLostKeywords, mockAhrefsFiles } from "@/lib/mock-data";
import { InfoCallout } from "./InfoCallout";

interface UploadedFileInfo {
  fileName: string;
  fileType: "organic-keywords" | "backlinks";
  rowCount: number;
  stats: KeywordMatchStats | BacklinkStats;
}

export function StepUploadAhrefs({
  onNext,
  onBack,
  candidateUrls,
  lostKeywords,
  onKeywordsParsed,
  onBacklinksParsed,
}: {
  onNext: () => void;
  onBack: () => void;
  candidateUrls: string[];
  lostKeywords: LostKeyword[];
  onKeywordsParsed: (keywords: LostKeyword[]) => void;
  onBacklinksParsed: (backlinks: ParsedBacklink[]) => void;
}) {
  const [files, setFiles] = useState<UploadedFileInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasKeywords = lostKeywords.length > 0;

  const processFile = useCallback(
    async (file: File) => {
      setParsing(true);
      setError(null);

      try {
        const parsed: ParsedCSV = await parseAhrefsCSV(file);

        if (parsed.fileType === "unknown") {
          setError(
            `"${file.name}" doesn't look like an Ahrefs export. Expected columns like "Keyword", "Volume" (organic keywords) or "Referring page URL", "Target URL" (backlinks).`
          );
          setParsing(false);
          return;
        }

        if (parsed.rowCount === 0) {
          setError(`"${file.name}" has headers but no data rows.`);
          setParsing(false);
          return;
        }

        if (parsed.fileType === "organic-keywords") {
          const keywords = transformToKeywords(parsed.rows, candidateUrls);
          const stats = getMatchStats(keywords);
          onKeywordsParsed(keywords);

          // Replace existing organic-keywords file entry
          setFiles((prev) => [
            ...prev.filter((f) => f.fileType !== "organic-keywords"),
            {
              fileName: parsed.fileName,
              fileType: "organic-keywords",
              rowCount: parsed.rowCount,
              stats,
            },
          ]);
        } else if (parsed.fileType === "backlinks") {
          const backlinks = transformToBacklinks(parsed.rows, candidateUrls);
          const stats = getBacklinkStats(backlinks);
          onBacklinksParsed(backlinks);

          setFiles((prev) => [
            ...prev.filter((f) => f.fileType !== "backlinks"),
            {
              fileName: parsed.fileName,
              fileType: "backlinks",
              rowCount: parsed.rowCount,
              stats,
            },
          ]);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to parse CSV file"
        );
      } finally {
        setParsing(false);
      }
    },
    [candidateUrls, onKeywordsParsed, onBacklinksParsed]
  );

  const handleFiles = useCallback(
    (fileList: FileList) => {
      Array.from(fileList).forEach((file) => {
        if (!file.name.endsWith(".csv")) {
          setError(`"${file.name}" is not a CSV file.`);
          return;
        }
        processFile(file);
      });
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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  function handleMockUpload() {
    onKeywordsParsed(mockLostKeywords);
    setFiles([
      {
        fileName: mockAhrefsFiles[0].name,
        fileType: "organic-keywords",
        rowCount: mockAhrefsFiles[0].rows,
        stats: { total: mockLostKeywords.length, matched: mockLostKeywords.filter((k) => k.candidateUrl !== "unassigned").length, unmatched: mockLostKeywords.filter((k) => k.candidateUrl === "unassigned").length },
      },
    ]);
    setError(null);
  }

  function removeFile(fileType: "organic-keywords" | "backlinks") {
    setFiles((prev) => prev.filter((f) => f.fileType !== fileType));
    if (fileType === "organic-keywords") {
      onKeywordsParsed([]);
    } else {
      onBacklinksParsed([]);
    }
  }

  return (
    <div className="space-y-6">
      <InfoCallout title="How to export from Ahrefs">
        <p>
          Go to <strong>Ahrefs Site Explorer</strong> → enter your domain →{" "}
          <strong>Organic Keywords</strong> → Export CSV. This gives us keyword
          positions, volume, and traffic data. Optionally, also export{" "}
          <strong>Backlinks</strong> (filter &quot;Lost&quot;) for link loss
          analysis.
        </p>
      </InfoCallout>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
          isDragging
            ? "border-accent bg-blue-50"
            : "border-slate-300 hover:border-accent/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          {parsing ? (
            <svg
              className="animate-spin text-accent"
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
            : "Drop Ahrefs CSV files here, or click to browse"}
        </p>
        <p className="text-xs text-muted">
          Accepts Organic Keywords and Backlinks exports (.csv)
        </p>
      </div>

      {/* Error */}
      {error && (
        <InfoCallout variant="danger" title="Import error">
          <p>{error}</p>
        </InfoCallout>
      )}

      {/* Uploaded files summary */}
      {files.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3">
            Uploaded Files ({files.length})
          </h3>
          <div className="space-y-2">
            {files.map((f) => (
              <div
                key={f.fileType}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-emerald-100">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-emerald-700"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{f.fileName}</div>
                    <div className="text-xs text-muted">
                      {f.fileType === "organic-keywords" ? (
                        <>
                          Organic Keywords &middot;{" "}
                          {(f.stats as KeywordMatchStats).total} keywords
                          &middot; Matched:{" "}
                          {(f.stats as KeywordMatchStats).matched} &middot;
                          Unmatched: {(f.stats as KeywordMatchStats).unmatched}
                        </>
                      ) : (
                        <>
                          Backlinks &middot; {(f.stats as BacklinkStats).total}{" "}
                          lost &middot; Targeting{" "}
                          {(f.stats as BacklinkStats).targetPages} candidate
                          pages
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                    {f.fileType === "organic-keywords"
                      ? "Organic Keywords"
                      : "Backlinks"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(f.fileType);
                    }}
                    className="text-muted hover:text-red-600 transition-colors"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No keywords warning */}
      {files.length > 0 && !hasKeywords && (
        <InfoCallout variant="danger" title="Missing required file">
          <p>
            An &quot;Organic Keywords&quot; export is required to proceed. This
            file contains the keyword-level data we need for analysis.
          </p>
        </InfoCallout>
      )}

      {/* Skip with mock data */}
      <div className="text-center">
        <button
          onClick={handleMockUpload}
          className="text-xs text-muted hover:text-accent transition-colors underline"
        >
          Skip — use mock data for development
        </button>
      </div>

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
          disabled={!hasKeywords}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Review Keywords
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
