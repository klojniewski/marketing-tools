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

export interface LostKeyword {
  keyword: string;
  volume: number;
  position: number;
  positionBefore: number;
  traffic: number;
  trafficChange: number;
  kd: number;
  valueScore: number;
  isJunk: boolean;
  junkReason: string | null;
  isSelected: boolean;
  candidateUrl: string;
}

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

export interface AuditConfig {
  siteUrl: string;
  periodAStart: string;
  periodAEnd: string;
  periodBStart: string;
  periodBEnd: string;
  comparisonMode: "28d" | "90d" | "yoy";
  impressionThreshold: number;
  clicksDropThreshold: number;
  blogUrlPattern: string;
  topicPatterns: string;
}

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface StepInfo {
  number: WizardStep;
  title: string;
  subtitle: string;
}

export const STEPS: StepInfo[] = [
  { number: 1, title: "Connect GSC", subtitle: "Link your Google Search Console account" },
  { number: 2, title: "Configure", subtitle: "Set date ranges and thresholds" },
  { number: 3, title: "Review Pages", subtitle: "Review declining pages from GSC" },
  { number: 4, title: "Import Ahrefs", subtitle: "Upload Ahrefs CSV exports" },
  { number: 5, title: "Keywords", subtitle: "Review and score lost keywords" },
  { number: 6, title: "Analyze", subtitle: "LLM-powered content gap analysis" },
  { number: 7, title: "Results", subtitle: "Download your audit report" },
];
