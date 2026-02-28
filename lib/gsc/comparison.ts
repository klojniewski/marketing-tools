import {
  querySearchAnalytics,
  type SearchAnalyticsRow,
} from "./client";
import { computeDateRanges } from "./date-ranges";
import type { AuditConfig, GSCCandidate } from "@/lib/types";

// Re-export so existing imports from comparison.ts still work
export { computeDateRanges } from "./date-ranges";

/**
 * Fetches data for both periods in parallel, merges by URL,
 * and computes all diffs.
 */
export async function fetchAndCompare(
  accessToken: string,
  config: AuditConfig
): Promise<GSCCandidate[]> {
  const ranges = computeDateRanges(config.comparisonMode);

  // Override with explicit dates if provided
  const periodA = {
    startDate: config.periodAStart || ranges.periodA.startDate,
    endDate: config.periodAEnd || ranges.periodA.endDate,
  };
  const periodB = {
    startDate: config.periodBStart || ranges.periodB.startDate,
    endDate: config.periodBEnd || ranges.periodB.endDate,
  };

  // Fetch both periods in parallel
  const [rowsA, rowsB] = await Promise.all([
    querySearchAnalytics(accessToken, {
      siteUrl: config.siteUrl,
      startDate: periodA.startDate,
      endDate: periodA.endDate,
      dimensions: ["page"],
    }),
    querySearchAnalytics(accessToken, {
      siteUrl: config.siteUrl,
      startDate: periodB.startDate,
      endDate: periodB.endDate,
      dimensions: ["page"],
    }),
  ]);

  // Index Period A by URL
  const mapA = new Map<string, SearchAnalyticsRow>();
  for (const row of rowsA) {
    const url = row.keys[0];
    mapA.set(url, row);
  }

  // Index Period B by URL
  const mapB = new Map<string, SearchAnalyticsRow>();
  for (const row of rowsB) {
    const url = row.keys[0];
    mapB.set(url, row);
  }

  // Merge: include any URL that appears in either period
  const allUrls = new Set([...mapA.keys(), ...mapB.keys()]);
  const candidates: GSCCandidate[] = [];

  for (const url of allUrls) {
    const a = mapA.get(url);
    const b = mapB.get(url);

    const impressionsA = a?.impressions ?? 0;
    const impressionsB = b?.impressions ?? 0;
    const clicksA = a?.clicks ?? 0;
    const clicksB = b?.clicks ?? 0;
    const positionA = a?.position ?? 0;
    const positionB = b?.position ?? 0;
    const ctrA = a?.ctr ?? 0;
    const ctrB = b?.ctr ?? 0;

    const clicksDiffPercent =
      clicksB > 0 ? ((clicksA - clicksB) / clicksB) * 100 : 0;
    const impressionsDiff =
      impressionsB > 0
        ? ((impressionsA - impressionsB) / impressionsB) * 100
        : 0;

    candidates.push({
      url,
      impressionsA,
      impressionsB,
      impressionsDiff,
      clicksA,
      clicksB,
      clicksDiffPercent,
      positionA,
      positionB,
      positionDiff: positionA - positionB, // positive = dropped in rankings
      ctrA,
      ctrB,
      ctrDiff: ctrA - ctrB,
      isImportant: false,
      topicMatch: null,
      hasCannibalization: false,
    });
  }

  return candidates;
}
