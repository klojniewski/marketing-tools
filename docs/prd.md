# SEO Content Audit Tool — PRD

> **Purpose of this document:** Persistent context for AI assistants across sessions. If you lost memory, read this first. Then read `docs/plans/2026-02-28-feat-seo-content-audit-tool-plan.md` for the full technical plan.

## 1. App Objective

**One-liner:** A web tool that helps an SEO analyst find declining blog posts, diagnose why they're losing traffic, and get AI-generated update recommendations.

**The problem:** Blog posts silently lose organic traffic over months. By the time someone notices, recovery is harder. Manually checking GSC, exporting Ahrefs data, comparing competitors, and deciding what to update is a tedious multi-hour process per page.

**The solution:** A 7-step wizard that automates what can be automated (GSC data, LLM analysis, Excel report) and guides the analyst through what can't be automated (Ahrefs CSV exports, keyword judgment calls).

**What this is NOT:**
- Not a fully automated pipeline — it's an analyst assistant tool
- Not a multi-user SaaS — single-user local tool
- Not a real-time monitoring dashboard — it's a periodic audit you run when needed

## 2. Who Uses This

**Primary user:** Chris (SEO analyst / content strategist). One person. No multi-user auth needed.

**Usage pattern:** Run an audit every 2-4 weeks. Walk through the wizard, export the Excel report, use it to prioritize content updates.

## 3. Core Workflow (7 Steps)

```
Step 1: Connect GSC     → OAuth into Google Search Console, pick a property
Step 2: Configure        → Set comparison window (28d/90d/YoY), thresholds, blog URL pattern, important topics
Step 3: Review Pages     → See declining pages table, select which to analyze
Step 4: Import Ahrefs    → Upload Ahrefs CSV exports (manual — no API access)
Step 5: Keywords         → Review scored keywords, override junk filters
Step 6: Analyze          → LLM fetches content + competitors, runs gap analysis
Step 7: Results          → View recommendations, download Excel report
```

## 4. Key Constraints

| Constraint | Implication |
|---|---|
| **No Ahrefs API** | Must guide user through manual CSV export with step-by-step instructions |
| **Single user** | No auth system beyond GSC OAuth. JSON files on disk for state. |
| **Self-hosted** | No serverless timeout issues. Can run long LLM pipelines. |
| **LLM can't browse** | App must fetch article content server-side, then pass to LLM in prompt |
| **Cost awareness** | Show estimated LLM cost before processing. Budget cap to prevent surprises. |

## 5. Tech Stack

- **Framework:** Next.js 16.1 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Auth:** NextAuth.js v5 (Auth.js) for Google OAuth
- **GSC:** `googleapis` npm package
- **CSV:** `csv-parse`
- **Excel:** `ExcelJS`
- **LLM:** `@anthropic-ai/sdk` (Claude Sonnet default)
- **Validation:** Zod (for LLM JSON responses and CSV mapping)
- **Content extraction:** `@mozilla/readability` + `jsdom`
- **Concurrency:** `p-limit` (max 3 parallel LLM calls)

## 6. Implementation Roadmap

### Phase 1: Static Mockup — COMPLETE ✅
> Branch: `feat/phase-1-static-mockup` (not yet committed)

Built the entire 7-step wizard with realistic mock data. All steps navigable, every field has help text/tooltips. This validated the UX flow before writing API code.

**What exists:**
- Landing page (`app/page.tsx`)
- Wizard container with step state management (`app/audit/page.tsx`)
- 7 step components in `app/audit/_components/Step*.tsx`
- 3 shared UI components: `InfoCallout`, `Tooltip`/`HelpIcon`, `StepIndicator`
- All TypeScript types (`lib/types.ts`)
- Comprehensive mock data covering 7 scenarios (`lib/mock-data.ts`)
- Custom Tailwind theme with CSS variables (`app/globals.css`)

### Phase 2: Connect GSC API — NOT STARTED
Make Step 1-3 dynamic with real Google Search Console data.

**Key deliverables:**
- NextAuth.js Google OAuth with `webmasters.readonly` scope
- GSC API client with pagination (25K row limit)
- Period comparison logic (two parallel API calls, merge, compute diffs)
- All filters: URL cleanup, drop thresholds, topic regex, impressions minimum
- Position and CTR diff calculations
- Basic Excel output with "Raw GSC Data" and "Candidates" tabs

**GSC API gotchas to remember:**
- No native date comparison — must make 2 separate queries
- `rows` is `undefined` not `[]` when empty — always use `?? []`
- URL filter needs full URLs not paths: `https://example\\.com/blog/.*`
- `impressions > 500` can't be server-side filtered — filter after fetch
- GSC data has 2-3 day delay — auto-adjust endDate
- RE2 regex (no lookahead/lookbehind)
- Use `google.searchconsole('v1')` not `webmasters('v3')`

### Phase 3: Ahrefs CSV Import — NOT STARTED
Make Step 4-5 dynamic with real CSV upload and keyword scoring.

**Key deliverables:**
- CSV upload API with file validation
- Ahrefs CSV parser with BOM handling, column auto-detection
- URL normalization for GSC ↔ Ahrefs matching
- Value Score calculation
- Keyword junk filters (volume, KD, brand exclusion)

### Phase 4: LLM Analysis — NOT STARTED
Make Step 6-7 dynamic with real content fetching and Claude API.

**Key deliverables:**
- Content extractor (fetch URL → parse HTML → extract article text)
- LLM prompt templates (app provides content, not LLM)
- Intent shift detection in prompt
- Zod schema for LLM response validation
- Retry logic for invalid JSON
- Cost tracking + budget cap
- Background job queue with SSE progress
- Full Excel report with all tabs

### Phase 5: Advanced Features — NOT STARTED
Polish and power-user features.

**Key deliverables:**
- Cannibalization detection via GSC `["page", "query"]` query
- Expanded displacement classification (SERP features, intent shift, seasonal)
- Consolidation recommendations
- Pipeline state persistence (save/resume)
- Audit history

## 7. Decision Log

| # | Date | Decision | Rationale | Alternatives Considered |
|---|---|---|---|---|
| D1 | 2026-02-28 | **Next.js 16** (not 15) | Latest stable with Turbopack default, `proxy.ts`, Cache Components | Next.js 15 (still supported but missing new features) |
| D2 | 2026-02-28 | **Manual Ahrefs CSV** import, not API | No Ahrefs API access available | Scraping (fragile, TOS violation), manual-only workflow |
| D3 | 2026-02-28 | **Local CSV/Excel** output, not Google Sheets | Avoids Sheets API complexity, works offline | Google Sheets API (complex OAuth scoping, rate limits) |
| D4 | 2026-02-28 | **Analyst assistant** tool, not fully automated pipeline | Need human judgment for keyword selection, priority decisions | Full automation (loses nuance), manual spreadsheet (too slow) |
| D5 | 2026-02-28 | **Route Handlers** over Server Actions | Better for file uploads, streaming SSE, long-running jobs | Server Actions (simpler but limited for these use cases) |
| D6 | 2026-02-28 | **In-process job queue + SSE** for background tasks | Simple for single-user; no Redis/external dependency | BullMQ + Redis (overkill), polling (worse UX) |
| D7 | 2026-02-28 | **JSON files on disk** for persistence | Simple for MVP single-user tool | SQLite (more complex), Postgres (way overkill) |
| D8 | 2026-02-28 | **Claude Sonnet** as default LLM | Best cost/quality balance for content analysis | GPT-4o (more expensive), Haiku (less capable for gap analysis) |
| D9 | 2026-02-28 | **Mockup-first** development approach | Validate UX flow before writing API code. Catch design issues early. | API-first (risk building wrong UX), parallel (complex coordination) |
| D10 | 2026-02-28 | **Removed "Algorithm Update Correlation"** from process | No reliable data source for Google algorithm updates | Manual tracking (too much maintenance) |
| D11 | 2026-02-28 | **Removed "Technical SEO Pre-Check"** | Assume technical SEO is OK. Focus on content gaps. GSC URL Inspection API has 2K/day limit — not practical for bulk checking. | URL Inspection API (rate-limited), Lighthouse (slow, different scope) |
| D12 | 2026-02-28 | **Self-hosted deployment** (not serverless) | LLM pipeline can run 2-5 minutes per audit. Serverless would timeout. | Vercel (10s-60s timeout), separate worker (complex) |
| D13 | 2026-02-28 | **7-step wizard** UI pattern | Linear flow matches the audit process. Each step builds on previous. | Dashboard (too complex for sequential process), CLI (no visual review) |
| D14 | 2026-02-28 | **Descriptive UI** — every element explains itself | User should never wonder "what does this do?" Callouts, tooltips, help text everywhere. | Minimal UI (faster to build, harder to use) |

## 8. Project Structure

```
marketing-tools/
├── app/
│   ├── layout.tsx                    # Root layout, Geist font, metadata
│   ├── page.tsx                      # Landing page with "Start Content Audit" CTA
│   ├── globals.css                   # Tailwind v4 theme (CSS vars + @theme inline)
│   ├── audit/
│   │   ├── page.tsx                  # Wizard container (step state, Next/Back nav)
│   │   └── _components/
│   │       ├── StepIndicator.tsx     # Horizontal step nav (active/completed/future)
│   │       ├── StepGSCConnect.tsx    # Step 1: Mock OAuth + site selection
│   │       ├── StepConfigurePeriods.tsx  # Step 2: Comparison window + thresholds
│   │       ├── StepGSCResults.tsx    # Step 3: Declining pages table
│   │       ├── StepUploadAhrefs.tsx  # Step 4: CSV instructions + drag-drop
│   │       ├── StepKeywordReview.tsx # Step 5: Scored keywords table
│   │       ├── StepProcessing.tsx    # Step 6: Progress simulation
│   │       ├── StepResults.tsx       # Step 7: Result cards + download
│   │       ├── InfoCallout.tsx       # Reusable alert (info/warning/success/danger)
│   │       └── Tooltip.tsx           # Tooltip + HelpIcon components
│   └── api/                          # (Phase 2+) API routes go here
├── lib/
│   ├── types.ts                      # All TypeScript interfaces + STEPS constant
│   └── mock-data.ts                  # Mock data for all 7 steps
├── config/                           # (Phase 2+) brand-exclusions.json, topic-patterns.json
├── docs/
│   ├── prd.md                        # THIS FILE — persistent context
│   ├── raw-spec.md                   # Original specification from client
│   └── plans/                        # Implementation plans
├── next.config.ts
├── package.json
└── tsconfig.json
```

## 9. Data Model (Types)

Key interfaces defined in `lib/types.ts`:

- **`GSCCandidate`** — A declining page with before/after metrics (impressions, clicks, position, CTR)
- **`LostKeyword`** — A keyword that lost ranking, with volume, KD, value score, junk status
- **`Competitor`** — A URL that displaced us, with DR, UR, displacement type
- **`LLMAnalysis`** — AI-generated recommendations per page (worse points, updates, priority, effort)
- **`AuditConfig`** — User settings (site URL, periods, thresholds, patterns)
- **`WizardStep`** — Union type `1 | 2 | 3 | 4 | 5 | 6 | 7`

## 10. SEO Process Improvements Over Original Spec

The original `raw-spec.md` had 7 critical gaps we fixed:

1. **Added cannibalization detection** — check if your own pages compete before blaming competitors
2. **Added position & CTR data** — not just impressions/clicks; enables richer diagnosis
3. **Flexible comparison windows** — 28d/90d/YoY instead of only 28d
4. **Search intent shift detection** — LLM checks if SERP intent changed (informational → commercial)
5. **Expanded displacement types** — added SERP feature takeover, intent shift categories
6. **Consolidation recommendations** — suggest merging overlapping declining pages
7. **Fixed LLM prompt** — app fetches content server-side, passes to LLM (LLM can't browse)

## 11. What To Work On Next

**Immediate next step:** Commit Phase 1, then start Phase 2 (GSC API integration).

Phase 2 priority order:
1. Set up NextAuth.js with Google OAuth
2. Build GSC API client with pagination
3. Wire Step 1 to real OAuth flow
4. Wire Step 2-3 to real GSC queries
5. Add basic Excel export
