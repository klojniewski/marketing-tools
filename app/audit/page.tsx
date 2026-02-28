"use client";

import { useState } from "react";
import type { WizardStep } from "@/lib/types";
import { STEPS } from "@/lib/types";
import { StepIndicator } from "./_components/StepIndicator";
import { StepGSCConnect } from "./_components/StepGSCConnect";
import { StepConfigurePeriods } from "./_components/StepConfigurePeriods";
import { StepGSCResults } from "./_components/StepGSCResults";
import { StepUploadAhrefs } from "./_components/StepUploadAhrefs";
import { StepKeywordReview } from "./_components/StepKeywordReview";
import { StepProcessing } from "./_components/StepProcessing";
import { StepResults } from "./_components/StepResults";

export default function AuditPage() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  const stepInfo = STEPS.find((s) => s.number === currentStep)!;

  function goNext() {
    if (currentStep < 7) setCurrentStep((currentStep + 1) as WizardStep);
  }

  function goBack() {
    if (currentStep > 1) setCurrentStep((currentStep - 1) as WizardStep);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold">SEO Content Audit</h1>
            <span className="text-xs text-muted">
              Step {currentStep} of {STEPS.length}
            </span>
          </div>
          <StepIndicator currentStep={currentStep} onStepClick={setCurrentStep} />
        </div>
      </header>

      {/* Step content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">{stepInfo.title}</h2>
          <p className="text-muted mt-1">{stepInfo.subtitle}</p>
        </div>

        {currentStep === 1 && <StepGSCConnect onNext={goNext} />}
        {currentStep === 2 && <StepConfigurePeriods onNext={goNext} onBack={goBack} />}
        {currentStep === 3 && <StepGSCResults onNext={goNext} onBack={goBack} />}
        {currentStep === 4 && <StepUploadAhrefs onNext={goNext} onBack={goBack} />}
        {currentStep === 5 && <StepKeywordReview onNext={goNext} onBack={goBack} />}
        {currentStep === 6 && <StepProcessing onNext={goNext} onBack={goBack} />}
        {currentStep === 7 && <StepResults onBack={goBack} />}
      </main>
    </div>
  );
}
