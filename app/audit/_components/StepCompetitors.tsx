"use client";

import { useState, useCallback } from "react";
import type { ManualCompetitor } from "@/lib/types";
import { InfoCallout } from "./InfoCallout";

interface StepCompetitorsProps {
  onNext: () => void;
  onBack: () => void;
  competitors: ManualCompetitor[];
  onCompetitorsUpdated: (competitors: ManualCompetitor[]) => void;
  targetKeyword: string;
}

const MAX_COMPETITORS = 5;

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function StatusIcon({ status }: { status: ManualCompetitor["fetchStatus"] }) {
  if (status === "fetched") {
    return (
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
    );
  }
  if (status === "failed") {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-red-400"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    );
  }
  return (
    <svg
      className="animate-spin text-muted"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );
}

export function StepCompetitors({
  onNext,
  onBack,
  competitors,
  onCompetitorsUpdated,
  targetKeyword,
}: StepCompetitorsProps) {
  const [urlInput, setUrlInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  const validateUrl = useCallback(
    async (url: string): Promise<ManualCompetitor> => {
      try {
        const res = await fetch("/api/validate-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (res.ok && data.reachable) {
          return {
            url: data.finalUrl || url,
            fetchStatus: "fetched",
            title: data.title || undefined,
          };
        }
        return {
          url,
          fetchStatus: "failed",
          failReason: data.error || "URL not reachable",
        };
      } catch {
        return { url, fetchStatus: "failed", failReason: "Validation failed" };
      }
    },
    []
  );

  async function addCompetitor() {
    let url = urlInput.trim();
    setInputError(null);

    if (!url) return;

    // Auto-prepend https if missing
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    if (!isValidUrl(url)) {
      setInputError("Please enter a valid URL (e.g. https://example.com/article)");
      return;
    }

    if (competitors.some((c) => c.url === url)) {
      setInputError("This URL has already been added.");
      return;
    }

    if (competitors.length >= MAX_COMPETITORS) {
      setInputError(`Maximum ${MAX_COMPETITORS} competitors allowed.`);
      return;
    }

    // Add as pending
    const pending: ManualCompetitor = { url, fetchStatus: "pending" };
    const updated = [...competitors, pending];
    onCompetitorsUpdated(updated);
    setUrlInput("");

    // Validate in background
    const validated = await validateUrl(url);
    onCompetitorsUpdated(
      updated.map((c) => (c.url === url ? validated : c))
    );
  }

  function removeCompetitor(url: string) {
    onCompetitorsUpdated(competitors.filter((c) => c.url !== url));
  }

  return (
    <div className="space-y-6">
      {/* Context */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs text-muted mb-1">Target keyword:</p>
        <p className="font-semibold">{targetKeyword}</p>
      </div>

      <InfoCallout title="How to find competitors">
        <p>
          Search Google for <strong>&ldquo;{targetKeyword}&rdquo;</strong> and add
          the top 3-5 ranking article URLs that compete with your content.
          The analysis will compare their structure, subtopics, and SEO signals
          against your article.
        </p>
      </InfoCallout>

      {/* Input */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="font-semibold mb-4">
          Competitor URLs ({competitors.length}/{MAX_COMPETITORS})
        </h3>

        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              setInputError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && addCompetitor()}
            placeholder="https://example.com/competing-article"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted/50"
            disabled={competitors.length >= MAX_COMPETITORS}
          />
          <button
            onClick={addCompetitor}
            disabled={!urlInput.trim() || competitors.length >= MAX_COMPETITORS}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-40"
          >
            Add
          </button>
        </div>

        {inputError && (
          <p className="mt-2 text-xs text-red-400">{inputError}</p>
        )}

        {/* Competitor list */}
        {competitors.length > 0 && (
          <ul className="mt-4 space-y-2">
            {competitors.map((c) => (
              <li
                key={c.url}
                className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5"
              >
                <StatusIcon status={c.fetchStatus} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono break-all">{c.url}</p>
                  {c.title && (
                    <p className="text-xs text-muted truncate mt-0.5">
                      {c.title}
                    </p>
                  )}
                  {c.failReason && (
                    <p className="text-xs text-red-400 mt-0.5">
                      {c.failReason}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeCompetitor(c.url)}
                  className="shrink-0 text-muted hover:text-red-400 transition-colors"
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
              </li>
            ))}
          </ul>
        )}
      </div>

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
          disabled={competitors.length === 0}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-40"
        >
          Run Analysis
        </button>
      </div>
    </div>
  );
}
