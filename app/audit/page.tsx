"use client";

import { useState, useCallback } from "react";
import type { WizardStep, GSCCandidate } from "@/lib/types";
import { STEPS } from "@/lib/types";
import { StepIndicator } from "./_components/StepIndicator";
import { StepGSCConnect } from "./_components/StepGSCConnect";
import { StepConfigurePeriods } from "./_components/StepConfigurePeriods";
import { StepUploadAhrefs } from "./_components/StepUploadAhrefs";
import { StepKeywordReview } from "./_components/StepKeywordReview";
import { StepProcessing } from "./_components/StepProcessing";
import { StepResults } from "./_components/StepResults";

interface GSCSite {
  siteUrl: string;
  permissionLevel: string;
}

function AuditWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Shared state lifted from child components
  const [gscSites, setGscSites] = useState<GSCSite[]>([]);
  const [selectedSiteUrl, setSelectedSiteUrl] = useState("");
  const [candidates, setCandidates] = useState<GSCCandidate[]>([]);

  const stepInfo = STEPS.find((s) => s.number === currentStep)!;

  function goNext() {
    if (currentStep < 6) setCurrentStep((currentStep + 1) as WizardStep);
  }

  function goBack() {
    if (currentStep > 1) setCurrentStep((currentStep - 1) as WizardStep);
  }

  const handleSiteSelected = useCallback((siteUrl: string) => {
    setSelectedSiteUrl(siteUrl);
  }, []);

  const handleSitesLoaded = useCallback((sites: GSCSite[]) => {
    setGscSites(sites);
  }, []);

  const handleCandidatesFetched = useCallback((newCandidates: GSCCandidate[]) => {
    setCandidates(newCandidates);
  }, []);

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

        {currentStep === 1 && (
          <StepGSCConnect
            onNext={goNext}
            onSiteSelected={handleSiteSelected}
            onSitesLoaded={handleSitesLoaded}
          />
        )}
        {currentStep === 2 && (
          <StepConfigurePeriods
            onNext={goNext}
            onBack={goBack}
            siteUrl={selectedSiteUrl}
            candidates={candidates}
            onCandidatesFetched={handleCandidatesFetched}
          />
        )}
        {currentStep === 3 && <StepUploadAhrefs onNext={goNext} onBack={goBack} />}
        {currentStep === 4 && <StepKeywordReview onNext={goNext} onBack={goBack} />}
        {currentStep === 5 && <StepProcessing onNext={goNext} onBack={goBack} />}
        {currentStep === 6 && <StepResults onBack={goBack} />}
      </main>
    </div>
  );
}

export default function AuditPage() {
  return <AuditWizard />;
}
