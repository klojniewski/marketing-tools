"use client";

import { useState } from "react";
import { mockAhrefsFiles } from "@/lib/mock-data";
import { InfoCallout } from "./InfoCallout";

interface UploadedFile {
  name: string;
  size: number;
  rows: number;
  type: "Organic Keywords" | "Backlinks" | "Competitor SERP";
}

export function StepUploadAhrefs({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  function handleMockUpload() {
    // Simulate uploading all mock files
    setUploadedFiles(mockAhrefsFiles);
  }

  function removeFile(name: string) {
    setUploadedFiles((prev) => prev.filter((f) => f.name !== name));
  }

  const hasKeywords = uploadedFiles.some((f) => f.type === "Organic Keywords");

  return (
    <div className="space-y-6">
      <InfoCallout title="Why do we need Ahrefs data?">
        <p>
          GSC tells us <em>which</em> pages are declining, but Ahrefs tells us{" "}
          <em>why</em>. Specifically, we need: <strong>(1)</strong> lost/declined
          organic keywords with volume and KD scores, <strong>(2)</strong>{" "}
          backlink data to assess authority changes, and <strong>(3)</strong>{" "}
          SERP competitor data to see who displaced you.
        </p>
      </InfoCallout>

      <InfoCallout variant="warning" title="No Ahrefs API — manual CSV export required">
        <p>
          Since we don&apos;t have Ahrefs API access, you&apos;ll need to export CSVs
          manually from Ahrefs. Here&apos;s what to export for each declining page:
        </p>
        <ol className="mt-3 space-y-2 list-decimal list-inside text-sm">
          <li>
            <strong>Organic Keywords</strong> — Go to Site Explorer → enter your
            domain → Organic Keywords → filter by your blog URLs → Export CSV.
            This gives us keyword positions, volume, and traffic data.
          </li>
          <li>
            <strong>Lost Backlinks (optional)</strong> — Site Explorer → Backlinks
            → filter &quot;Lost&quot; last 90 days → Export. Helps identify authority
            losses.
          </li>
          <li>
            <strong>SERP Competitors (optional)</strong> — For each key term,
            check SERP Overview → Export the top 10 results. Helps us understand
            who displaced you.
          </li>
        </ol>
      </InfoCallout>

      {/* Upload area */}
      <div
        className="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center hover:border-accent/50 transition-colors cursor-pointer"
        onClick={handleMockUpload}
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
        </div>
        <p className="text-sm font-medium mb-1">
          Drop CSV files here, or click to browse
        </p>
        <p className="text-xs text-muted">
          Accepts .csv files exported from Ahrefs
        </p>
        <p className="text-xs text-muted mt-2 italic">
          (Click to load demo files for this mockup)
        </p>
      </div>

      {/* Uploaded files */}
      {uploadedFiles.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3">
            Uploaded Files ({uploadedFiles.length})
          </h3>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-emerald-100">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-700">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{file.name}</div>
                    <div className="text-xs text-muted">
                      {file.type} · {file.rows.toLocaleString()} rows ·{" "}
                      {(file.size / 1000).toFixed(0)} KB
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                    {file.type}
                  </span>
                  <button
                    onClick={() => removeFile(file.name)}
                    className="text-muted hover:text-red-600 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

      {/* Validation message */}
      {uploadedFiles.length > 0 && !hasKeywords && (
        <InfoCallout variant="danger" title="Missing required file">
          <p>
            An &quot;Organic Keywords&quot; export is required to proceed. This file
            contains the keyword-level data we need for analysis.
          </p>
        </InfoCallout>
      )}

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
          disabled={!hasKeywords}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Review Keywords
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
