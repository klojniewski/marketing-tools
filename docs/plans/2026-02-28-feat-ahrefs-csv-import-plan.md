---
title: "feat: Real Ahrefs CSV Import"
type: feat
date: 2026-02-28
---

# Real Ahrefs CSV Import (Step 3)

## Overview

Replace the mock upload in Step 3 with real CSV file parsing. Users drag-and-drop Ahrefs CSV exports, the system auto-detects file type, parses the data, matches keywords to candidate pages from Step 2, computes value scores, and passes structured data to Step 4 (Keyword Review).

## Problem Statement

Step 3 currently loads hardcoded mock data on click. Real Ahrefs CSV exports have specific formats that differ from assumptions in the original types:

1. **Encoding**: Organic keywords CSV is UTF-16LE with BOM, tab-delimited, quoted fields
2. **No keyword-to-page mapping**: The organic keywords export is domain-level — no URL column linking keywords to specific pages
3. **No KD column**: Keyword Difficulty is not included in the provided export format
4. **Backlinks CSV**: Different encoding (UTF-8), different delimiter, has `Target URL` for page mapping

## Proposed Solution

Client-side parsing using `papaparse` (browser-native, handles encoding/delimiters automatically). No API route needed — CSVs contain no secrets and parsing is fast. Server-side would add unnecessary upload latency for files that never need to leave the browser.

### Key Design Decisions

**D1: Client-side parsing (not server-side)**
- Ahrefs CSVs are user-provided local files, not fetched from an API
- `papaparse` auto-detects delimiters, handles UTF-16/BOM natively
- Avoids file upload API route, FormData overhead, and server memory
- Parsed data stays in React state, passed via props like existing pattern

**D2: Drop KD from `LostKeyword` type (make optional)**
- The real Ahrefs "Organic Keywords" export doesn't include KD
- Make `kd` optional (`kd?: number`), adjust value score formula accordingly
- If user uploads a different export that has KD, we use it; otherwise skip

**D3: Keyword-to-page matching via URL slug heuristic**
- Domain-level export has no URL column — we can't know which page ranks for which keyword
- But we have the candidate URLs from Step 2 (GSC data)
- Match by checking if keyword terms appear in the URL slug (e.g., keyword "sanity cms nextjs" matches `/blog/sanity-cms-nextjs-tutorial`)
- Show unmatched keywords in a separate "Unassigned" section
- Let users manually reassign keywords via dropdown

**D4: Simplify file types to 2 (not 3)**
- Real exports are: "Organic Keywords" and "Backlinks"
- Drop "Competitor SERP" as a separate upload type — that data doesn't exist as a standard Ahrefs export
- Backlinks data maps to lost link analysis (optional enrichment, not blocking)

## Acceptance Criteria

- [x] Drag-and-drop file upload with click fallback (`<input type="file">`)
- [x] Accept `.csv` files, auto-detect type from column headers
- [x] Handle UTF-16LE + BOM encoding (organic keywords) and UTF-8 (backlinks)
- [x] Handle tab-delimited and comma-delimited files
- [x] Parse organic keywords into `LostKeyword[]` with value scores
- [x] Parse backlinks into structured data with Target URL mapping
- [x] Match keywords to candidate pages from Step 2 via slug matching
- [x] Show parsed data summary (row count, matched/unmatched keywords)
- [x] "Skip with mock data" still works for development
- [x] Next button requires at least 1 keyword file uploaded
- [x] Step 4 (KeywordReview) receives real data via props instead of importing mocks

## Implementation Plan

### Phase 1: CSV Parser Library (`lib/ahrefs/`)

#### `lib/ahrefs/parse-csv.ts`

Client-side CSV parser using `papaparse`.

```typescript
import Papa from "papaparse";

export type AhrefsFileType = "organic-keywords" | "backlinks" | "unknown";

export interface ParsedCSV {
  fileType: AhrefsFileType;
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
  fileName: string;
}

// Auto-detect file type from column headers
const ORGANIC_KEYWORDS_MARKERS = ["Keyword", "Volume", "Current organic traffic"];
const BACKLINKS_MARKERS = ["Referring page URL", "Domain rating", "Target URL"];

export function detectFileType(headers: string[]): AhrefsFileType {
  const normalized = headers.map(h => h.replace(/^"|"$/g, "").trim());
  if (ORGANIC_KEYWORDS_MARKERS.every(m => normalized.includes(m))) return "organic-keywords";
  if (BACKLINKS_MARKERS.every(m => normalized.includes(m))) return "backlinks";
  return "unknown";
}

export function parseAhrefsCSV(file: File): Promise<ParsedCSV> {
  // papaparse handles encoding detection, delimiter detection, BOM stripping
}
```

#### `lib/ahrefs/transform-keywords.ts`

Transform parsed CSV rows into `LostKeyword[]`.

```typescript
// Column mapping: Ahrefs column name → our field
// "Keyword" → keyword
// "Volume" → volume
// "Previous organic traffic" → traffic (before, used to compute trafficChange)
// "Current organic traffic" → traffic (current)
// "Organic traffic change" → trafficChange
// "Previous average position" → positionBefore
// "Current average position" → position
// KD → not available, defaults to undefined

export function transformToKeywords(
  rows: Record<string, string>[],
  candidateUrls: string[]
): LostKeyword[] {
  // 1. Map columns
  // 2. Match keywords to candidate URLs via slug heuristic
  // 3. Compute value scores
  // 4. Apply junk filters
  // 5. Auto-select top keywords per page
}
```

#### `lib/ahrefs/transform-backlinks.ts`

Transform backlinks CSV rows into a structured format.

```typescript
// Column mapping:
// "Referring page URL" → referringUrl
// "Domain rating" → domainRating
// "Target URL" → targetUrl (maps to candidate pages)
// "Lost status" → lostStatus (filter for lost backlinks)
// "Drop reason" → dropReason
// "First seen" / "Last seen" / "Lost" → dates

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

export function transformToBacklinks(
  rows: Record<string, string>[],
  candidateUrls: string[]
): ParsedBacklink[] {
  // Filter to only backlinks targeting candidate URLs
  // Filter to only lost backlinks (lostStatus !== "")
}
```

#### `lib/ahrefs/match-urls.ts`

URL matching heuristics for keyword-to-page assignment.

```typescript
// Normalize URL: strip protocol, www, trailing slash
export function normalizeUrl(url: string): string { ... }

// Match keyword to candidate page by checking slug overlap
export function matchKeywordToPage(
  keyword: string,
  candidateUrls: string[]
): string | null {
  // 1. Tokenize keyword: "sanity cms nextjs tutorial" → ["sanity", "cms", "nextjs", "tutorial"]
  // 2. For each candidate URL, extract slug: "/blog/sanity-cms-nextjs-tutorial" → ["sanity", "cms", "nextjs", "tutorial"]
  // 3. Score by token overlap ratio
  // 4. Return best match above threshold (e.g., >= 50% overlap), or null
}
```

#### `lib/ahrefs/scoring.ts`

Value score calculation per raw-spec formula.

```typescript
// Score = (Volume × 0.4) + (|TrafficLoss| × 0.5) + (PositionBefore × 0.1) − (KD × 0.05 if available)
export function computeValueScore(kw: {
  volume: number;
  trafficChange: number;
  positionBefore: number;
  kd?: number;
}): number { ... }

// Junk keyword detection
export function detectJunk(kw: {
  volume: number;
  kd?: number;
  keyword: string;
  topicPatterns?: string;
}): { isJunk: boolean; junkReason: string | null } {
  // Volume < 100 → junk
  // KD > 65 (if available) → junk
  // Keyword is branded/unrelated → junk (check against topic patterns)
}
```

### Phase 2: Update Types (`lib/types.ts`)

```typescript
// Make kd optional
export interface LostKeyword {
  keyword: string;
  volume: number;
  position: number;
  positionBefore: number;
  traffic: number;
  trafficChange: number;
  kd?: number;          // ← was required, now optional
  valueScore: number;
  isJunk: boolean;
  junkReason: string | null;
  isSelected: boolean;
  candidateUrl: string; // matched via heuristic, or "unassigned"
}
```

Update mock data `kd` references to stay compatible.

### Phase 3: Rewrite StepUploadAhrefs Component

Replace mock-only upload with real file handling:

```
Step 3 "Import Ahrefs":
┌─────────────────────────────────┐
│ [Info callout: what to export]  │
│                                 │
│ ┌─ Drop zone ─────────────────┐ │
│ │  Drop CSV files here        │ │
│ │  or click to browse         │ │
│ └─────────────────────────────┘ │
│                                 │
│ Uploaded Files (2):             │
│ ┌─────────────────────────────┐ │
│ │ ✓ organic-keywords.csv      │ │
│ │   Organic Keywords · 717 kw │ │
│ │   Matched: 412 · Unmatched: │ │
│ │   305                       │ │
│ ├─────────────────────────────┤ │
│ │ ✓ backlinks.csv             │ │
│ │   Backlinks · 110 lost      │ │
│ │   Targeting 8 candidate pgs │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Back]         [Next: Keywords] │
└─────────────────────────────────┘
```

Key changes to `app/audit/_components/StepUploadAhrefs.tsx`:
- Add `<input type="file" accept=".csv" multiple>` hidden, triggered by drop zone click
- Add drag-and-drop handlers (`onDragOver`, `onDrop`)
- On file added: call `parseAhrefsCSV()` → detect type → transform
- Pass `candidateUrls` as prop (from parent, derived from Step 2 candidates)
- Call `onKeywordsParsed(keywords)` callback to lift data to parent
- Call `onBacklinksParsed(backlinks)` callback (optional)
- Show per-file summary: type detected, row count, match stats
- Reject unknown file types with error message
- Keep "Skip with mock data" for dev

### Phase 4: Wire Up Parent State (`app/audit/page.tsx`)

Add to `AuditWizard`:

```typescript
const [lostKeywords, setLostKeywords] = useState<LostKeyword[]>([]);
const [backlinks, setBacklinks] = useState<ParsedBacklink[]>([]);

// Pass to Step 3:
<StepUploadAhrefs
  onNext={goNext}
  onBack={goBack}
  candidateUrls={candidates.map(c => c.url)}
  lostKeywords={lostKeywords}
  onKeywordsParsed={setLostKeywords}
  onBacklinksParsed={setBacklinks}
/>

// Pass to Step 4:
<StepKeywordReview
  onNext={goNext}
  onBack={goBack}
  keywords={lostKeywords}
  onKeywordsUpdated={setLostKeywords}
/>
```

### Phase 5: Update StepKeywordReview (`app/audit/_components/StepKeywordReview.tsx`)

- Accept `keywords` and `onKeywordsUpdated` as props instead of importing `mockLostKeywords`
- Make KD column conditional (show dash if `kd` is undefined)
- Update value score formula display in InfoCallout to match the actual formula
- Keep the same table UI, filtering, and selection logic

### Phase 6: Install Dependency

```bash
npm install papaparse
npm install -D @types/papaparse
```

## Files to Create (5 new files)

| File | Purpose |
|---|---|
| `lib/ahrefs/parse-csv.ts` | CSV parsing with papaparse, file type detection |
| `lib/ahrefs/transform-keywords.ts` | Map CSV rows → LostKeyword[] |
| `lib/ahrefs/transform-backlinks.ts` | Map CSV rows → ParsedBacklink[] |
| `lib/ahrefs/match-urls.ts` | URL normalization + keyword-to-page matching |
| `lib/ahrefs/scoring.ts` | Value score calculation + junk detection |

## Files to Modify (4 files)

| File | Changes |
|---|---|
| `lib/types.ts` | Make `kd` optional in `LostKeyword` |
| `app/audit/page.tsx` | Add `lostKeywords`/`backlinks` state, wire props |
| `app/audit/_components/StepUploadAhrefs.tsx` | Real file upload + parsing |
| `app/audit/_components/StepKeywordReview.tsx` | Accept data via props, conditional KD column |

## Edge Cases

- **Wrong file type**: User uploads a non-Ahrefs CSV → show "Unrecognized format" error with expected columns
- **Empty CSV**: File has headers but no data rows → show warning, don't block
- **Duplicate upload**: User uploads same file twice → replace previous file of same type
- **No keyword matches**: All keywords unmatched to pages → show warning, still allow proceeding (keywords go to "Unassigned")
- **Very large file**: 10k+ rows → papaparse streams, but we should show a loading state
- **Mixed encodings**: One file UTF-16, another UTF-8 → papaparse handles this per-file

## Dependencies

- `papaparse` (^5.4.1) — browser CSV parser with encoding detection
- `@types/papaparse` — TypeScript definitions

## References

- Example files: `docs/example-files/pagepro.co-organic-keywords-*.csv`, `docs/example-files/pagepro.co-backlinks-*.csv`
- Existing patterns: `app/audit/page.tsx` (state lifting), `lib/gsc/` (domain utility organization)
- Raw spec value score formula: `docs/raw-spec.md:67-72`
- Current StepUploadAhrefs: `app/audit/_components/StepUploadAhrefs.tsx`
- Current StepKeywordReview: `app/audit/_components/StepKeywordReview.tsx`
