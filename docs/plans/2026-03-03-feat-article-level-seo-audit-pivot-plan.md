---
title: "Article-Level SEO Audit Pivot"
type: feat
date: 2026-03-03
source: "Alina's feedback on production testing"
---

# Article-Level SEO Audit Pivot

## Overview

Pivot the SEO Content Audit tool from domain-wide batch analysis to **single-article deep-dive analysis**, based on Alina's feedback from production testing. Each audit session focuses on one article with its own keyword dataset, manually specified competitors, and a comprehensive three-section analysis output.

**Key principle:** One article, one keyword dataset, one set of competitors, one deep analysis.

## Feasibility Assessment of Alina's 6 Points

| # | Feedback | Feasible? | Effort | Notes |
|---|---|---|---|---|
| 1 | Article-level (not domain-level) | Yes | Medium | Current architecture already selects per-URL. Need to enforce single-article focus. |
| 2 | Article-specific keyword dataset | Yes | Medium | New Ahrefs article-level CSV parser. Replaces slug heuristic with URL-column matching. |
| 3 | Custom GSC data filters | Yes | Small | Add 3-4 filter fields to existing `StepConfigurePeriods` component. |
| 4 | Remove "junk keyword" labeling | Yes | Small | Delete `detectJunk()`, remove `isJunk`/`junkReason` from types and UI. |
| 5 | Manual competitor entry (no SERP) | Yes | Small | New simple component. Actually simpler than the planned automated approach. |
| 6 | Comprehensive analysis output | Yes | Large | This IS Phase 4 (LLM analysis), which was always the next planned phase. |

**Verdict:** All points are feasible. This is a refinement of the planned direction, not a rewrite. The biggest work item (#6) was already queued as Phase 4.

---

## Problem Statement

The current tool performs domain-wide analysis: fetch all declining pages, upload domain-level Ahrefs CSV, heuristic-match keywords to pages, batch-analyze multiple pages. Alina's testing reveals this introduces noise and reduces analytical accuracy for the actual use case: updating a single blog article.

**Current pain points:**
- Domain-level keyword list creates noise when diagnosing a single article's traffic drop
- Slug-token heuristic for keyword-to-page matching is imprecise
- "Junk keyword" labeling is inappropriate for blog content (a keyword irrelevant to a service page may be perfect for a blog)
- Competitor identification cannot be reliably automated without SERP API access
- Analysis output lacks structured diagnosis and actionable recommendations

---

## Proposed New Wizard Flow

```
CURRENT (6 steps, domain-wide):
  1. Connect GSC
  2. Configure & Review → see ALL declining pages → select MULTIPLE
  3. Import Ahrefs (domain-level CSV, slug heuristic matching)
  4. Keywords (review matched keywords, junk detection)
  5. Analyze (mock)
  6. Results (mock)

PROPOSED (6 steps, single-article):
  1. Connect GSC + Enhanced Filters → see declining pages list
  2. Select 1 Article + Upload Article-Specific Ahrefs CSV
  3. Select Target Keyword (manual or AI-assisted)
  4. Add Competitors (manual URL entry)
  5. Analyze (LLM-powered, fetches article + competitor HTML)
  6. Results (3-section comprehensive output)
```

**What changes:**
- Steps 1-2: Minor — add filters, enforce single article selection, merge Ahrefs upload into article selection step
- Step 3: Moderate rewrite — becomes "Select Target Keyword" instead of "Review Keywords"
- Step 4: New component — manual competitor URL entry
- Steps 5-6: Built from scratch (were mocked anyway) — this is Phase 4 LLM work

**What stays the same:**
- OAuth flow (Step 1)
- GSC data fetching core (`lib/gsc/client.ts`, `lib/gsc/comparison.ts`)
- Ahrefs CSV parsing engine (`lib/ahrefs/parse-csv.ts` — extended, not replaced)
- Wizard shell and step indicator UI

---

## Technical Approach

### Architecture

**Data flow changes:**

```
CURRENT:
  GSCCandidate[] → LostKeyword[] (domain-wide, heuristic-matched) → LLMAnalysis[]

PROPOSED:
  GSCCandidate[] → select ONE → ArticleKeyword[] (article-specific CSV) →
    select target keyword → add competitor URLs → ArticleAnalysis (single, deep)
```

**Two-phase GSC fetch strategy:**
1. Step 1 fetches with `dimensions: ["page"]` (fast, same as today) — for the article list
2. After article selection, fire a second GSC call with `dimensions: ["page", "query"]` scoped to that single page — gives per-query traffic data for the selected article

This avoids the performance problem of fetching 500K+ rows upfront.

### New Type Definitions

`lib/types.ts` — key additions/changes:

```typescript
// Replaces LostKeyword — article-specific, no junk detection
export interface ArticleKeyword {
  keyword: string;
  volume: number;
  position: number;
  positionPrevious: number;
  positionChange: number;     // positionPrevious - position (positive = improved)
  traffic: number;
  trafficChange: number;
  kd?: number;
  url: string;                // from article-level export (no heuristic needed)
  status: "ranking" | "lost" | "new" | "declined";
  valueScore: number;
}

// Manual competitor entry
export interface ManualCompetitor {
  url: string;
  fetchStatus: "pending" | "fetched" | "failed";
  failReason?: string;
  title?: string;             // extracted after fetch
  wordCount?: number;         // extracted after fetch
}

// New comprehensive analysis output — replaces LLMAnalysis
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
    serpFeatureNotes: string[];   // inferred from CTR data patterns
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

// Extended audit config with new filters
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
  // New filters (Alina's point #3)
  minClicksThreshold: number;       // minimum clicks in period B
  positionDropThreshold: number;     // minimum position drop (absolute, e.g. 3)
  includeUrlKeyword: string;         // URL must contain this string
  excludeUrlKeyword: string;         // URL must NOT contain this string
}

// Updated wizard steps
export const STEPS: StepInfo[] = [
  { number: 1, title: "Connect & Filter", subtitle: "Connect GSC, set filters, review declining pages" },
  { number: 2, title: "Select Article", subtitle: "Choose one article and upload its Ahrefs data" },
  { number: 3, title: "Target Keyword", subtitle: "Pick the keyword to recover" },
  { number: 4, title: "Competitors", subtitle: "Add competitor URLs for comparison" },
  { number: 5, title: "Analyze", subtitle: "AI-powered content gap analysis" },
  { number: 6, title: "Results", subtitle: "Diagnosis, competitor comparison & recommendations" },
];
```

### Implementation Phases

#### Phase 4A: GSC Filter Enhancement + Single Article Selection

**Goal:** Add Alina's requested GSC filters and enforce single-article selection.

**Tasks:**

- [ ] Add new filter fields to `AuditConfig` type in `lib/types.ts`
  - `minClicksThreshold` (default: 5)
  - `positionDropThreshold` (default: 3 positions, absolute)
  - `includeUrlKeyword` (default: empty)
  - `excludeUrlKeyword` (default: empty)

- [ ] Update `lib/analysis/filters.ts` — add new filter functions
  - `filterByMinClicks(candidates, threshold)` — drop pages with clicksB < threshold
  - `filterByPositionDrop(candidates, threshold)` — drop pages where positionDiff < threshold
  - `filterByUrlKeyword(candidates, include, exclude)` — substring match on URL path
  - Add to `applyAllFilters()` pipeline

- [ ] Update `app/api/gsc/query/route.ts` — accept new filter params

- [ ] Update `app/audit/_components/StepConfigurePeriods.tsx`
  - Add filter input fields: min clicks, position drop threshold, include/exclude URL keyword
  - Change page selection from multi-checkbox to single-select (radio or click-to-select)
  - Rename component to `StepConnectAndFilter.tsx`
  - Show selected article prominently with a "Selected for analysis" highlight

- [ ] Remove junk keyword logic (Alina's point #4)
  - Delete `detectJunk()` from `lib/ahrefs/scoring.ts`
  - Remove `isJunk` and `junkReason` from `LostKeyword` interface
  - Remove junk badge UI from `StepKeywordReview.tsx`

**Success criteria:**
- [ ] User can filter GSC results by min clicks, position drop, and URL keywords
- [ ] User selects exactly 1 article to proceed
- [ ] No "junk keyword" concept anywhere in the UI

#### Phase 4B: Article-Specific Ahrefs Import

**Goal:** Support article-level Ahrefs CSV exports (which have a URL column).

**Tasks:**

- [ ] Add article-level keyword detection to `lib/ahrefs/parse-csv.ts`
  - New marker set: `ARTICLE_KEYWORDS_MARKERS = ["Keyword", "Volume", "Current position", "Previous position", "URL"]`
  - Detect article-level vs domain-level by presence of "URL" and "Current position" columns
  - Keep domain-level support as fallback (backwards compatible)

- [ ] Create `lib/ahrefs/transform-article-keywords.ts`
  - Map CSV columns to `ArticleKeyword` interface
  - Compute `positionChange = positionPrevious - position`
  - Determine `status`: "lost" if position = 0 or >100, "declined" if positionChange < 0, "new" if positionPrevious = 0, else "ranking"
  - Compute `valueScore` using updated formula (no junk penalty)
  - Filter to only rows matching the selected article URL (case-insensitive URL normalization)

- [ ] Update `app/audit/_components/StepUploadAhrefs.tsx`
  - Merge into article selection step (Step 2): after selecting article in Step 1, Step 2 shows the selected article + upload area
  - Show instructions: "In Ahrefs Site Explorer, go to your article URL → Organic Keywords → Export CSV"
  - Validate that uploaded keywords match the selected article URL
  - Show warning if URL mismatch detected
  - Display keyword summary after upload: total keywords, lost count, average position change

- [ ] Delete `lib/ahrefs/match-urls.ts` (slug heuristic no longer needed)

**Success criteria:**
- [ ] User uploads article-specific Ahrefs CSV and sees keyword list for that article
- [ ] URL-column matching replaces slug heuristic
- [ ] Clear instructions guide the user to the correct Ahrefs export

#### Phase 4C: Target Keyword Selection + Competitor Entry

**Goal:** New steps for selecting the recovery target keyword and adding competitors.

**Tasks:**

- [ ] Create `app/audit/_components/StepTargetKeyword.tsx` (Step 3)
  - Display all article keywords sorted by value score descending
  - Columns: Keyword, Volume, Position (current), Position (previous), Change, Traffic Change, Status
  - Color coding: red for big drops, green for gains
  - Single-select (radio button or click-to-select)
  - "AI Suggest" button (opt-in): calls LLM to recommend the best target keyword
    - Input to LLM: article URL, keyword list with metrics, article topic (from URL slug)
    - Output: recommended keyword + reasoning
    - Display as a highlighted suggestion that user can accept or override
  - Selected keyword shown prominently with a "Target keyword" badge

- [ ] Create `app/audit/_components/StepCompetitors.tsx` (Step 4)
  - URL input field + "Add" button
  - List of added competitor URLs with remove button
  - On add: validate URL format, attempt HEAD request to check if reachable
  - Show status icon: green checkmark (reachable), yellow warning (slow/redirect), red X (unreachable)
  - Guidance text: "Search Google for your target keyword and add the top 3-5 ranking URLs that compete with your article"
  - Minimum 1 competitor required to proceed (disable Next button if 0)
  - Maximum 5 competitors (to keep LLM context manageable)

- [ ] Create `app/api/validate-url/route.ts`
  - HEAD request to check URL reachability
  - Return status code, final URL (after redirects), title tag if available

**Success criteria:**
- [ ] User can select a target keyword from the article's keyword list
- [ ] AI suggestion is available but optional
- [ ] User can add 1-5 competitor URLs with validation feedback

#### Phase 4D: LLM Analysis Engine

**Goal:** Build the comprehensive analysis engine (Alina's point #6).

**Tasks:**

- [ ] Create `lib/llm/client.ts` — Claude API wrapper
  - Use Anthropic SDK with claude-sonnet-4-20250514 (cost-effective for analysis)
  - Streaming support for progress UI
  - Retry with exponential backoff on rate limits
  - Token usage tracking

- [ ] Create `lib/llm/content-fetcher.ts` — HTML content extraction
  - Server-side fetch of article and competitor URLs
  - HTML → readable text extraction (strip nav, footer, scripts, ads)
  - Extract structured data: headings (H1-H6), meta title, meta description, FAQ sections, internal links
  - Handle failures gracefully (return partial data with error note)
  - Cache fetched content for the session

- [ ] Create `lib/llm/prompts.ts` — prompt templates
  - System prompt: SEO expert persona with structured output requirements
  - User prompt template that includes:
    - Selected article URL + extracted content + heading structure
    - Target keyword + all article keywords with metrics
    - GSC query-level data for the article (from two-phase fetch)
    - Each competitor's extracted content + heading structure
    - Explicit instruction to output JSON matching `ArticleAnalysis` schema
  - Prompt for AI keyword suggestion (Step 3)

- [ ] Create `lib/llm/schemas.ts` — Zod validation schemas
  - `articleAnalysisSchema` matching `ArticleAnalysis` type
  - `keywordSuggestionSchema` for AI keyword recommendation
  - Validation + fallback for malformed LLM output

- [ ] Create `app/api/audit/analyze/route.ts` — analysis API endpoint
  - Accept: selected article URL, target keyword, article keywords, competitor URLs, GSC query data
  - Fetch article + competitor content via `content-fetcher.ts`
  - Build prompt via `prompts.ts`
  - Call Claude API via `client.ts`
  - Validate output via `schemas.ts`
  - Stream progress updates to client
  - Return `ArticleAnalysis` JSON

- [ ] Create second GSC query for article-level query data
  - Add to `lib/gsc/client.ts`: `queryArticleSearchAnalytics(auth, siteUrl, articleUrl, periodA, periodB)`
  - Uses `dimensions: ["page", "query"]` with `dimensionFilterGroups` scoped to the article URL
  - Returns per-query clicks, impressions, position, CTR for both periods
  - Called after article selection, before analysis

- [ ] Update `app/audit/_components/StepProcessing.tsx` (Step 5)
  - Replace mock progress with real progress tracking
  - Stages: "Fetching article content..." → "Fetching competitor content..." → "Analyzing with AI..." → "Generating recommendations..."
  - Show fetch status per competitor (success/failed)
  - Handle partial failures: if 1 of 3 competitors fails to fetch, continue with 2

**Success criteria:**
- [ ] Real LLM analysis runs against actual article + competitor content
- [ ] Output matches the `ArticleAnalysis` schema
- [ ] Progress UI shows real stages
- [ ] Graceful handling of content fetch failures

#### Phase 4E: Comprehensive Results UI

**Goal:** Display the three-section analysis output (Alina's point #6).

**Tasks:**

- [ ] Rewrite `app/audit/_components/StepResults.tsx` (Step 6) with three sections:

  **Section A: Position Loss Diagnosis**
  - Summary card with primary cause
  - Keyword cluster table: cluster name, keywords, avg position change, trend arrow
  - Intent analysis card: detected intent, mismatch warning if applicable
  - Topical gaps as a checklist
  - EEAT issues as warning cards
  - SERP feature notes (inferred from CTR patterns)

  **Section B: Competitor Strength Analysis**
  - Tab per competitor (or accordion)
  - Per competitor: heading structure comparison (side-by-side with our article)
  - Subtopics they cover that we don't (highlighted diff)
  - FAQ/TL;DR presence badges
  - Internal link count comparison
  - Meta title & description comparison
  - Content strengths summary

  **Section C: Update Recommendations**
  - Priority-sorted recommendation cards
  - Each card: category badge (color-coded), priority indicator, title, details, rationale
  - Categories: Heading Restructure, Missing Content, FAQ, Featured Snippet, TL;DR, Cross-Linking, Meta Tags, EEAT, AEO
  - Suggested title + meta description at the top with copy buttons
  - Effort + recovery likelihood badges
  - "Export as PDF" and "Copy to clipboard" buttons

- [ ] Add a "Start New Analysis" button that returns to Step 1 with GSC data cached

**Success criteria:**
- [ ] All three sections render with real LLM data
- [ ] Competitor comparison is per-competitor with clear visual diffs
- [ ] Recommendations are actionable and priority-sorted
- [ ] User can export or copy the results

---

## Files Changed

### New Files
| File | Purpose |
|---|---|
| `lib/ahrefs/transform-article-keywords.ts` | Article-level CSV → ArticleKeyword[] |
| `app/audit/_components/StepTargetKeyword.tsx` | Step 3: select target keyword |
| `app/audit/_components/StepCompetitors.tsx` | Step 4: add competitor URLs |
| `lib/llm/client.ts` | Claude API wrapper |
| `lib/llm/content-fetcher.ts` | HTML extraction for articles + competitors |
| `lib/llm/prompts.ts` | Prompt templates |
| `lib/llm/schemas.ts` | Zod validation for LLM output |
| `app/api/audit/analyze/route.ts` | Analysis API endpoint |
| `app/api/validate-url/route.ts` | URL reachability check |

### Modified Files
| File | Changes |
|---|---|
| `lib/types.ts` | Add `ArticleKeyword`, `ManualCompetitor`, `ArticleAnalysis`, update `AuditConfig`, update `STEPS` |
| `lib/analysis/filters.ts` | Add `filterByMinClicks`, `filterByPositionDrop`, `filterByUrlKeyword` |
| `lib/ahrefs/parse-csv.ts` | Add article-level keyword detection markers |
| `lib/ahrefs/scoring.ts` | Remove `detectJunk()`, keep `computeValueScore()` |
| `lib/gsc/client.ts` | Add `queryArticleSearchAnalytics()` for `["page","query"]` dimension |
| `app/api/gsc/query/route.ts` | Accept new filter params |
| `app/audit/page.tsx` | New wizard state shape: `selectedArticle`, `articleKeywords`, `targetKeyword`, `competitors` |
| `app/audit/_components/StepConfigurePeriods.tsx` | Add filter fields, single-select, rename to `StepConnectAndFilter.tsx` |
| `app/audit/_components/StepUploadAhrefs.tsx` | Becomes part of Step 2 (article selection + upload) |
| `app/audit/_components/StepKeywordReview.tsx` | Delete or gut — replaced by `StepTargetKeyword.tsx` |
| `app/audit/_components/StepProcessing.tsx` | Real progress tracking |
| `app/audit/_components/StepResults.tsx` | Full rewrite for 3-section output |

### Deleted Files
| File | Reason |
|---|---|
| `lib/ahrefs/match-urls.ts` | Slug heuristic eliminated — article-level exports have URL column |

---

## Open Questions for Alina

Before implementation, these need answers:

### Must Answer

**Q1: Which Ahrefs export is needed in Step 2?**
Most likely: Site Explorer → enter article URL → Organic Keywords → Export. This gives: Keyword, Volume, Current position, Previous position, Traffic, Traffic change, URL, KD. Is this correct? Or does the user need a separate "Lost Keywords" filtered export?

**Q2: Authority data for competitor analysis — what's the source?**
Section B mentions "authority signals." Without an Ahrefs SERP export, we can only assess authority from content signals (depth, citations, author credentials) — not domain rating (DR/UR). Is qualitative authority analysis from content sufficient?

**Q3: What does AEO mean in the recommendations?**
Assumed: Answer Engine Optimization (optimizing for AI search results like Google AI Overviews). Confirm and clarify what structural elements this includes.

### Nice to Have

**Q4: After completing an analysis, should the user be able to quickly analyze another article from the same GSC data without re-authenticating?**

**Q5: Position drop threshold — should this be absolute (dropped 3+ positions) or configurable between absolute and percentage?**

**Q6: Should the AI keyword suggestion in Step 3 be free (included in the analysis cost) or show a cost estimate before running?**

---

## Dependencies & Risks

**Dependencies:**
- Anthropic API key for LLM analysis (Claude Sonnet)
- Ahrefs article-level CSV format documentation (need example files)
- Content fetcher must handle JS-rendered sites (consider using a simple fetch + cheerio for now, upgrade to headless browser if needed)

**Risks:**
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Competitor URLs block crawlers | High | Medium | Show clear error, allow analysis to proceed without that competitor |
| LLM output doesn't match schema | Medium | Medium | Zod validation + retry with corrective prompt |
| Article content is JS-rendered (SPA) | Medium | Low | fetch + cheerio handles most blogs; flag SPAs as unsupported |
| GSC `["page","query"]` call is slow for large sites | Low | Medium | Only call for single selected article, not all pages |
| LLM context too large with 5 competitors | Low | Medium | Cap at 5 competitors, truncate content to first 3000 words each |

---

## Success Metrics

- Analyst can complete a single-article audit in < 10 minutes (GSC → results)
- Analysis output is actionable enough that Alina can create a content brief directly from it
- Zero "junk keyword" references in the UI
- Competitor comparison provides specific structural diffs (not generic advice)

---

## References

- Existing plan: `docs/plans/2026-02-28-feat-seo-content-audit-tool-plan.md`
- Current types: `lib/types.ts`
- Current filters: `lib/analysis/filters.ts`
- Current Ahrefs parser: `lib/ahrefs/parse-csv.ts`
- Current GSC client: `lib/gsc/client.ts`
- Ahrefs scoring: `lib/ahrefs/scoring.ts`
- Slug heuristic (to delete): `lib/ahrefs/match-urls.ts`
