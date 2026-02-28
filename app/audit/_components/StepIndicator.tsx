"use client";

import { STEPS, type WizardStep } from "@/lib/types";

export function StepIndicator({
  currentStep,
  onStepClick,
}: {
  currentStep: WizardStep;
  onStepClick: (step: WizardStep) => void;
}) {
  return (
    <nav className="flex items-center gap-1 overflow-x-auto pb-2">
      {STEPS.map((step, i) => {
        const isActive = step.number === currentStep;
        const isCompleted = step.number < currentStep;
        const isClickable = step.number <= currentStep;

        return (
          <div key={step.number} className="flex items-center">
            <button
              onClick={() => isClickable && onStepClick(step.number)}
              disabled={!isClickable}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-accent text-white font-medium"
                  : isCompleted
                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                    : "text-muted cursor-default"
              }`}
            >
              <span
                className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : isCompleted
                      ? "bg-emerald-200 text-emerald-800"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {isCompleted ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  step.number
                )}
              </span>
              <span className="hidden sm:inline">{step.title}</span>
            </button>
            {i < STEPS.length - 1 && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 mx-1 shrink-0">
                <path d="M9 18l6-6-6-6" />
              </svg>
            )}
          </div>
        );
      })}
    </nav>
  );
}
