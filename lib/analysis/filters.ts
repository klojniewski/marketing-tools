import type { GSCCandidate } from "@/lib/types";

/**
 * Removes URLs containing fragment identifiers (#).
 * These are typically anchor links to sections within a page,
 * not separate pages, and would create false duplicates.
 */
export function filterFragmentUrls(rows: GSCCandidate[]): GSCCandidate[] {
  return rows.filter((row) => !row.url.includes("#"));
}

/**
 * Filters candidates by blog URL pattern.
 * Only keeps URLs whose path contains the given pattern substring.
 */
export function filterByBlogPattern(
  rows: GSCCandidate[],
  pattern: string
): GSCCandidate[] {
  if (!pattern.trim()) return rows;
  const lowerPattern = pattern.toLowerCase();
  return rows.filter((row) => row.url.toLowerCase().includes(lowerPattern));
}

/**
 * Applies minimum impression and clicks drop thresholds.
 * - impressionThreshold: minimum impressions in Period B (baseline)
 * - clicksDropThreshold: minimum % drop in clicks (as positive number, e.g. 20 for -20%)
 */
export function filterByThresholds(
  candidates: GSCCandidate[],
  config: { impressionThreshold: number; clicksDropThreshold: number }
): GSCCandidate[] {
  return candidates.filter((c) => {
    // Must have enough baseline impressions
    if (c.impressionsB < config.impressionThreshold) return false;
    // Must have a meaningful clicks drop (clicksDiffPercent is negative for drops)
    if (c.clicksDiffPercent > -config.clicksDropThreshold) return false;
    return true;
  });
}

/**
 * Applies topic patterns to candidates, setting isImportant flag
 * and topicMatch string for any URL slug that matches.
 */
export function applyTopicFilter(
  candidates: GSCCandidate[],
  patternsString: string
): GSCCandidate[] {
  if (!patternsString.trim()) return candidates;

  const patterns = patternsString
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);

  if (patterns.length === 0) return candidates;

  return candidates.map((candidate) => {
    // Extract the URL slug for matching
    let slug: string;
    try {
      slug = new URL(candidate.url).pathname.toLowerCase();
    } catch {
      slug = candidate.url.toLowerCase();
    }

    // Also match against hyphenated versions (e.g. "headless cms" matches "headless-cms")
    for (const pattern of patterns) {
      const hyphenated = pattern.replace(/\s+/g, "-");
      if (slug.includes(hyphenated) || slug.includes(pattern.replace(/\s+/g, ""))) {
        return {
          ...candidate,
          isImportant: true,
          topicMatch: pattern,
        };
      }
    }

    return candidate;
  });
}

/**
 * Pipeline: run all filters in sequence.
 */
export function applyAllFilters(
  candidates: GSCCandidate[],
  config: {
    blogUrlPattern: string;
    impressionThreshold: number;
    clicksDropThreshold: number;
    topicPatterns: string;
  }
): GSCCandidate[] {
  let result = filterFragmentUrls(candidates);
  result = filterByBlogPattern(result, config.blogUrlPattern);
  result = filterByThresholds(result, config);
  result = applyTopicFilter(result, config.topicPatterns);

  // Sort: important first, then by clicks drop (most severe first)
  result.sort((a, b) => {
    if (a.isImportant !== b.isImportant) return a.isImportant ? -1 : 1;
    return a.clicksDiffPercent - b.clicksDiffPercent;
  });

  return result;
}
