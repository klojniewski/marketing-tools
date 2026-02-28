import type { ParsedBacklink } from "@/lib/types";
import { normalizeUrl } from "./match-urls";

/**
 * Column mapping from Ahrefs "Backlinks" export:
 *   "Referring page URL" → referringUrl
 *   "Referring page title" → referringTitle
 *   "Domain rating" → domainRating
 *   "Target URL" → targetUrl
 *   "Lost status" → lostStatus
 *   "Drop reason" → dropReason
 *   "First seen" → firstSeen
 *   "Last seen" → lastSeen
 *   "Lost" → lostDate
 */

function clean(val: string | undefined): string {
  if (!val) return "";
  return val.replace(/^"|"$/g, "").trim();
}

function parseNum(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/[",]/g, "").trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

export function transformToBacklinks(
  rows: Record<string, string>[],
  candidateUrls: string[]
): ParsedBacklink[] {
  const normalizedCandidates = candidateUrls.map(normalizeUrl);

  const backlinks: ParsedBacklink[] = [];

  for (const row of rows) {
    const targetUrl = clean(row["Target URL"]);
    if (!targetUrl) continue;

    // Only include backlinks targeting candidate pages
    const normalizedTarget = normalizeUrl(targetUrl);
    const matchesCandidate = normalizedCandidates.some(
      (c) => normalizedTarget === c || normalizedTarget.startsWith(c)
    );
    if (!matchesCandidate) continue;

    const lostStatus = clean(row["Lost status"]);
    // Only include lost backlinks (has a lost status)
    if (!lostStatus) continue;

    backlinks.push({
      referringUrl: clean(row["Referring page URL"]),
      referringTitle: clean(row["Referring page title"]),
      domainRating: parseNum(row["Domain rating"]),
      targetUrl,
      lostStatus,
      dropReason: clean(row["Drop reason"]),
      firstSeen: clean(row["First seen"]),
      lastSeen: clean(row["Last seen"]),
      lostDate: clean(row["Lost"]),
    });
  }

  // Sort by domain rating descending (highest authority lost links first)
  backlinks.sort((a, b) => b.domainRating - a.domainRating);

  return backlinks;
}

export interface BacklinkStats {
  total: number;
  targetPages: number;
}

export function getBacklinkStats(backlinks: ParsedBacklink[]): BacklinkStats {
  const targetPages = new Set(backlinks.map((b) => normalizeUrl(b.targetUrl)))
    .size;
  return {
    total: backlinks.length,
    targetPages,
  };
}
