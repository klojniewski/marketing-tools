import type { GSCCandidate } from "@/lib/types";

/**
 * Removes URLs containing fragment identifiers (#).
 */
export function filterFragmentUrls(rows: GSCCandidate[]): GSCCandidate[] {
  return rows.filter((row) => !row.url.includes("#"));
}

/**
 * Filters candidates by blog URL pattern.
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
 */
export function filterByThresholds(
  candidates: GSCCandidate[],
  config: { impressionThreshold: number; clicksDropThreshold: number }
): GSCCandidate[] {
  return candidates.filter((c) => {
    if (c.impressionsB < config.impressionThreshold) return false;
    if (c.clicksDiffPercent > -config.clicksDropThreshold) return false;
    return true;
  });
}

/**
 * Filters by minimum clicks in Period B (baseline).
 * Pages with fewer clicks than the threshold are excluded.
 */
export function filterByMinClicks(
  candidates: GSCCandidate[],
  threshold: number
): GSCCandidate[] {
  if (threshold <= 0) return candidates;
  return candidates.filter((c) => c.clicksB >= threshold);
}

/**
 * Filters by minimum position drop (absolute).
 * positionDiff is positionA - positionB; positive = dropped in rankings.
 * Only keeps pages where the position drop >= threshold.
 */
export function filterByPositionDrop(
  candidates: GSCCandidate[],
  threshold: number
): GSCCandidate[] {
  if (threshold <= 0) return candidates;
  return candidates.filter((c) => c.positionDiff >= threshold);
}

/**
 * Filters by URL keyword inclusion/exclusion.
 * - include: URL path must contain this substring (case-insensitive)
 * - exclude: URL path must NOT contain this substring (case-insensitive)
 */
export function filterByUrlKeyword(
  candidates: GSCCandidate[],
  include: string,
  exclude: string
): GSCCandidate[] {
  let result = candidates;

  if (include.trim()) {
    const lowerInclude = include.trim().toLowerCase();
    result = result.filter((c) => c.url.toLowerCase().includes(lowerInclude));
  }

  if (exclude.trim()) {
    const lowerExclude = exclude.trim().toLowerCase();
    result = result.filter((c) => !c.url.toLowerCase().includes(lowerExclude));
  }

  return result;
}

/**
 * Applies topic patterns to candidates, setting isImportant flag.
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
    let slug: string;
    try {
      slug = new URL(candidate.url).pathname.toLowerCase();
    } catch {
      slug = candidate.url.toLowerCase();
    }

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
    minClicksThreshold?: number;
    positionDropThreshold?: number;
    includeUrlKeyword?: string;
    excludeUrlKeyword?: string;
  }
): GSCCandidate[] {
  let result = filterFragmentUrls(candidates);
  result = filterByBlogPattern(result, config.blogUrlPattern);
  result = filterByThresholds(result, config);

  // New filters (Alina's feedback)
  if (config.minClicksThreshold != null) {
    result = filterByMinClicks(result, config.minClicksThreshold);
  }
  if (config.positionDropThreshold != null) {
    result = filterByPositionDrop(result, config.positionDropThreshold);
  }
  if (config.includeUrlKeyword != null || config.excludeUrlKeyword != null) {
    result = filterByUrlKeyword(
      result,
      config.includeUrlKeyword ?? "",
      config.excludeUrlKeyword ?? ""
    );
  }

  result = applyTopicFilter(result, config.topicPatterns);

  // Sort: important first, then by clicks drop (most severe first)
  result.sort((a, b) => {
    if (a.isImportant !== b.isImportant) return a.isImportant ? -1 : 1;
    return a.clicksDiffPercent - b.clicksDiffPercent;
  });

  return result;
}
