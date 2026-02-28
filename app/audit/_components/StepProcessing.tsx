"use client";

import { useState, useEffect, useCallback } from "react";
import { mockProcessingSteps } from "@/lib/mock-data";
import { InfoCallout } from "./InfoCallout";

export function StepProcessing({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const currentProcessStep = mockProcessingSteps[currentStepIndex];
  const progress = currentProcessStep?.progress ?? 0;

  const startProcessing = useCallback(() => {
    setIsRunning(true);
    setCurrentStepIndex(0);
    setIsComplete(false);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    if (currentStepIndex >= mockProcessingSteps.length - 1) {
      setIsComplete(true);
      setIsRunning(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStepIndex((prev) => prev + 1);
    }, 800);

    return () => clearTimeout(timer);
  }, [isRunning, currentStepIndex]);

  return (
    <div className="space-y-6">
      <InfoCallout title="What happens during analysis?">
        <p>
          For each selected page, we: <strong>(1)</strong> fetch the current
          article content from your site, <strong>(2)</strong> fetch the top
          competitor pages that displaced you, <strong>(3)</strong> send both to
          Claude Sonnet with your keyword data and ask it to identify content
          gaps, missing sections, and update recommendations. Each page takes
          15-30 seconds depending on content length.
        </p>
      </InfoCallout>

      {!isRunning && !isComplete && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Ready to analyze</h3>
          <p className="text-sm text-muted mb-6 max-w-md mx-auto">
            We&apos;ll analyze 5 pages with their selected keywords. This will make
            approximately 5 LLM calls and fetch ~15 URLs for content comparison.
          </p>
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={startProcessing}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Start Analysis
            </button>
            <p className="text-xs text-muted">
              Estimated time: ~2 minutes · Estimated cost: ~$0.12
            </p>
          </div>
        </div>
      )}

      {(isRunning || isComplete) && (
        <div className="space-y-6">
          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">
                {isComplete ? "Analysis complete" : currentProcessStep?.label}
              </span>
              <span className="text-muted tabular-nums">{progress}%</span>
            </div>
            <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isComplete ? "bg-emerald-500" : "bg-accent"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Log */}
          <div className="rounded-lg border border-border bg-slate-900 p-4 max-h-64 overflow-y-auto font-mono text-xs">
            {mockProcessingSteps.slice(0, currentStepIndex + 1).map((step, i) => (
              <div key={i} className="flex items-start gap-2 py-0.5">
                <span className="text-slate-500 shrink-0">
                  [{String(i + 1).padStart(2, "0")}]
                </span>
                {i < currentStepIndex ? (
                  <span className="text-emerald-400">{step.label}</span>
                ) : isComplete && i === currentStepIndex ? (
                  <span className="text-emerald-400">{step.label}</span>
                ) : (
                  <span className="text-blue-400">
                    {step.label}
                    <span className="animate-pulse"> ●</span>
                  </span>
                )}
                {step.url && (
                  <span className="text-slate-500 truncate">
                    — .../{step.url}
                  </span>
                )}
              </div>
            ))}
          </div>

          {isComplete && (
            <InfoCallout variant="success" title="Analysis complete">
              <p>
                All 5 pages have been analyzed. The AI identified actionable
                recommendations for each page, including content gaps, missing
                sections, and update priorities. Click &quot;View Results&quot; to review
                the full report.
              </p>
            </InfoCallout>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          onClick={onBack}
          disabled={isRunning}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </button>
        {isComplete && (
          <button
            onClick={onNext}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            View Results
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
