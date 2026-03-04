"use client";

import { useState, useCallback } from "react";
import type { WizardStep, GSCCandidate, ArticleKeyword, ManualCompetitor, ArticleAnalysis } from "@/lib/types";
import { STEPS } from "@/lib/types";
import { StepIndicator } from "./_components/StepIndicator";
import { StepGSCConnect } from "./_components/StepGSCConnect";
import { StepConnectAndFilter } from "./_components/StepConnectAndFilter";
import { StepSelectArticle } from "./_components/StepSelectArticle";
import { StepTargetKeyword } from "./_components/StepTargetKeyword";
import { StepCompetitors } from "./_components/StepCompetitors";
import { StepAnalyze } from "./_components/StepAnalyze";

interface GSCSite {
  siteUrl: string;
  permissionLevel: string;
}

function AuditWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Step 1: GSC connect
  const [selectedSiteUrl, setSelectedSiteUrl] = useState("");
  const [candidates, setCandidates] = useState<GSCCandidate[]>([]);

  // Step 2: Single article selection
  const [selectedArticleUrl, setSelectedArticleUrl] = useState<string | null>(null);

  // Step 3: Article-specific keywords from Ahrefs upload
  const [articleKeywords, setArticleKeywords] = useState<ArticleKeyword[]>([]);

  // Step 4: Target keyword
  const [targetKeyword, setTargetKeyword] = useState<string | null>(null);

  // Step 5: Competitors
  const [competitors, setCompetitors] = useState<ManualCompetitor[]>([]);

  // Step 6: Analysis result
  const [analysisResult, setAnalysisResult] = useState<ArticleAnalysis | null>(null);

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

  const handleSitesLoaded = useCallback(() => {}, []);

  const handleCandidatesFetched = useCallback((newCandidates: GSCCandidate[]) => {
    setCandidates(newCandidates);
  }, []);

  const handleArticleSelected = useCallback((url: string | null) => {
    setSelectedArticleUrl(url);
    // Reset downstream state when article changes
    setArticleKeywords([]);
    setTargetKeyword(null);
    setCompetitors([]);
    setAnalysisResult(null);
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

        {/* Step 1: Connect GSC */}
        {currentStep === 1 && (
          <StepGSCConnect
            onNext={goNext}
            onSiteSelected={handleSiteSelected}
            onSitesLoaded={handleSitesLoaded}
          />
        )}

        {/* Step 2: Filter & Select Article */}
        {currentStep === 2 && (
          <StepConnectAndFilter
            onNext={goNext}
            onBack={goBack}
            siteUrl={selectedSiteUrl}
            candidates={candidates}
            onCandidatesFetched={handleCandidatesFetched}
            selectedArticleUrl={selectedArticleUrl}
            onArticleSelected={handleArticleSelected}
          />
        )}

        {/* Step 3: Import Ahrefs */}
        {currentStep === 3 && (
          <StepSelectArticle
            onNext={goNext}
            onBack={goBack}
            selectedArticleUrl={selectedArticleUrl!}
            articleKeywords={articleKeywords}
            onKeywordsParsed={setArticleKeywords}
          />
        )}

        {/* Step 4: Target Keyword */}
        {currentStep === 4 && (
          <StepTargetKeyword
            onNext={goNext}
            onBack={goBack}
            keywords={articleKeywords}
            targetKeyword={targetKeyword}
            onTargetKeywordSelected={setTargetKeyword}
            articleUrl={selectedArticleUrl!}
          />
        )}

        {/* Step 5: Competitors */}
        {currentStep === 5 && (
          <StepCompetitors
            onNext={goNext}
            onBack={goBack}
            competitors={competitors}
            onCompetitorsUpdated={setCompetitors}
            targetKeyword={targetKeyword!}
          />
        )}

        {/* Step 6: Analyze + Results */}
        {currentStep === 6 && (
          <StepAnalyze
            onBack={goBack}
            articleUrl={selectedArticleUrl!}
            targetKeyword={targetKeyword!}
            articleKeywords={articleKeywords}
            competitors={competitors}
            analysisResult={analysisResult}
            onAnalysisComplete={setAnalysisResult}
          />
        )}
      </main>
    </div>
  );
}

export default function AuditPage() {
  return <AuditWizard />;
}
