// ─── GSC Candidates (page-level, unchanged) ────────────────────────────────

export interface GSCCandidate {
  url: string;
  impressionsA: number;
  impressionsB: number;
  impressionsDiff: number;
  clicksA: number;
  clicksB: number;
  clicksDiffPercent: number;
  positionA: number;
  positionB: number;
  positionDiff: number;
  ctrA: number;
  ctrB: number;
  ctrDiff: number;
  isImportant: boolean;
  topicMatch: string | null;
  hasCannibalization: boolean;
  cannibalizingUrl?: string;
}

// ─── Article-level keywords (replaces LostKeyword) ─────────────────────────

export interface ArticleKeyword {
  keyword: string;
  volume: number;
  position: number;
  positionPrevious: number;
  positionChange: number; // positionPrevious - position (positive = improved)
  traffic: number;
  trafficChange: number;
  kd?: number;
  url: string; // from article-level export (no heuristic needed)
  status: "ranking" | "lost" | "new" | "declined";
  valueScore: number;
}

// ─── Legacy: LostKeyword (kept for backwards compat during migration) ──────

export interface LostKeyword {
  keyword: string;
  volume: number;
  position: number;
  positionBefore: number;
  traffic: number;
  trafficChange: number;
  kd?: number;
  valueScore: number;
  isSelected: boolean;
  candidateUrl: string;
  isJunk?: boolean;
  junkReason?: string;
}

// ─── Backlinks (unchanged) ─────────────────────────────────────────────────

export interface ParsedBacklink {
  referringUrl: string;
  referringTitle: string;
  domainRating: number;
  targetUrl: string;
  lostStatus: string;
  dropReason: string;
  firstSeen: string;
  lastSeen: string;
  lostDate: string;
}

// ─── Manual Competitors ────────────────────────────────────────────────────

export interface ManualCompetitor {
  url: string;
  fetchStatus: "pending" | "fetched" | "failed";
  failReason?: string;
  title?: string;
  wordCount?: number;
}

// ─── Article Analysis (comprehensive LLM output) ──────────────────────────

export interface ArticleAnalysis {
  articleUrl: string;
  targetKeyword: string;

  // Section A: Position Loss Diagnosis
  diagnosis: {
    summary: string;
    keywordClusters: {
      cluster: string;
      keywords: string[];
      avgPositionChange: number;
      trend: "declining" | "stable" | "improving";
    }[];
    intentAnalysis: {
      currentIntent: string;
      mismatchDetected: boolean;
      explanation: string;
    };
    topicalGaps: string[];
    eeatIssues: string[];
    serpFeatureNotes: string[];
  };

  // Section B: Competitor Strength Analysis
  competitorAnalysis: {
    url: string;
    headingStructure: { tag: string; text: string }[];
    coveredSubtopics: string[];
    missingFromOurs: string[];
    hasFAQ: boolean;
    hasTLDR: boolean;
    internalLinkCount: number;
    metaTitle: string;
    metaDescription: string;
    contentStrengths: string[];
  }[];

  // Section C: Update Recommendations
  recommendations: {
    category:
      | "heading-restructure"
      | "missing-content"
      | "faq"
      | "featured-snippet"
      | "tldr"
      | "cross-linking"
      | "meta-tags"
      | "eeat"
      | "aeo";
    priority: "high" | "medium" | "low";
    title: string;
    details: string;
    rationale: string;
  }[];
  suggestedTitle: string;
  suggestedMeta: string;
  estimatedEffort: "Small" | "Medium" | "Large";
  recoveryLikelihood: "High" | "Medium" | "Low";
}

// ─── Legacy: LLMAnalysis (kept for mock data during migration) ─────────────

export interface LLMAnalysis {
  candidateUrl: string;
  worsePoints: string[];
  strengths: string[];
  whatToAddOrUpdate: {
    section: string;
    action: string;
    details: string;
    why: string;
  }[];
  suggestedTitle: string;
  suggestedMeta: string;
  updatePlanSummary: string;
  estimatedEffort: "Small" | "Medium" | "Large";
  priority: number;
  recoveryLikelihood: "High" | "Medium" | "Low";
  intentShifted: boolean;
  consolidateWith: string | null;
  shouldUpdate: "Yes" | "Doubtful" | "No - low value keys" | "No - intent shifted";
}

// ─── Audit Config ──────────────────────────────────────────────────────────

export interface AuditConfig {
  siteUrl: string;
  periodAStart: string;
  periodAEnd: string;
  periodBStart: string;
  periodBEnd: string;
  comparisonMode: "28d" | "90d" | "yoy";
  // Existing filters
  impressionThreshold: number;
  clicksDropThreshold: number;
  blogUrlPattern: string;
  topicPatterns: string;
  // New filters (Alina's feedback)
  minClicksThreshold: number;
  positionDropThreshold: number;
  includeUrlKeyword: string;
  excludeUrlKeyword: string;
}

// ─── GSC Article Query Data ────────────────────────────────────────────────

export interface GSCQueryRow {
  query: string;
  clicksA: number;
  clicksB: number;
  clicksDiffPercent: number;
  impressionsA: number;
  impressionsB: number;
  impressionsDiff: number;
  positionA: number;
  positionB: number;
  positionDiff: number;
  ctrA: number;
  ctrB: number;
}

// ─── Competitor (legacy, kept for mock data) ───────────────────────────────

export interface Competitor {
  url: string;
  domainRating: number;
  urlRating: number;
  estimatedTraffic: number;
  newBacklinks90d: number;
  displacementType:
    | "High authority"
    | "Content update"
    | "New article"
    | "SERP feature"
    | "Intent shift"
    | "Other";
  keyword: string;
}

// ─── Wizard Steps ──────────────────────────────────────────────────────────

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface StepInfo {
  number: WizardStep;
  title: string;
  subtitle: string;
}

export const STEPS: StepInfo[] = [
  { number: 1, title: "Connect GSC", subtitle: "Link your Google Search Console account" },
  { number: 2, title: "Filter & Select", subtitle: "Filter declining pages and select one article" },
  { number: 3, title: "Import Ahrefs", subtitle: "Upload article-specific keyword data" },
  { number: 4, title: "Target Keyword", subtitle: "Pick the keyword to recover" },
  { number: 5, title: "Competitors", subtitle: "Add competitor URLs for comparison" },
  { number: 6, title: "Analyze", subtitle: "AI analysis, diagnosis & recommendations" },
];
