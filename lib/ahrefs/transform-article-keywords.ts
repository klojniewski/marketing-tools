import type { ArticleKeyword } from "@/lib/types";
import { computeValueScore } from "./scoring";

/**
 * Column mapping from Ahrefs article-level "Organic Keywords" export:
 *   "Keyword"           → keyword
 *   "Volume"            → volume
 *   "Current position"  → position
 *   "Previous position" → positionPrevious
 *   "Current organic traffic"  → traffic
 *   "Organic traffic change"   → trafficChange
 *   "Keyword Difficulty" / "KD" → kd (optional)
 *   "URL"               → url
 */

function parseNum(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/[",]/g, "").trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return (u.origin + u.pathname).replace(/\/$/, "").toLowerCase();
  } catch {
    return url.replace(/\/$/, "").toLowerCase();
  }
}

function deriveStatus(
  position: number,
  positionPrevious: number,
  positionChange: number,
  hasCurrentPosition: boolean,
  hasPreviousPosition: boolean
): ArticleKeyword["status"] {
  // No current position at all → lost
  if (!hasCurrentPosition) return "lost";
  // Has current but no previous → newly ranking
  if (hasCurrentPosition && !hasPreviousPosition) return "new";
  // Position dropped out of top 100
  if (position > 100) return "lost";
  // Significant decline (position number went up by >2)
  if (positionChange > 2) return "declined";
  return "ranking";
}

export function transformArticleKeywords(
  rows: Record<string, string>[],
  selectedArticleUrl: string
): ArticleKeyword[] {
  const normalizedSelected = normalizeUrl(selectedArticleUrl);
  const keywords: ArticleKeyword[] = [];

  for (const row of rows) {
    const keyword = (row["Keyword"] || "").replace(/^"|"$/g, "").trim();
    if (!keyword) continue;

    const url = (row["URL"] || "").replace(/^"|"$/g, "").trim();

    // Filter to only rows matching the selected article URL
    if (url && normalizeUrl(url) !== normalizedSelected) continue;

    const volume = parseNum(row["Volume"]);

    const currentPosRaw =
      row["Current position"] || row["Current average position"] || "";
    const previousPosRaw =
      row["Previous position"] || row["Previous average position"] || "";
    const hasCurrentPosition = currentPosRaw.trim() !== "";
    const hasPreviousPosition = previousPosRaw.trim() !== "";

    const position = parseNum(currentPosRaw);
    const positionPrevious = parseNum(previousPosRaw);
    const positionChange =
      row["Position change"] !== undefined
        ? parseNum(row["Position change"])
        : positionPrevious > 0 && position > 0
          ? position - positionPrevious
          : 0;
    const traffic = parseNum(row["Current organic traffic"]);
    const trafficChange = parseNum(row["Organic traffic change"]);

    const kdRaw = row["Keyword Difficulty"] || row["KD"];
    const kd = kdRaw ? parseNum(kdRaw) : undefined;

    const status = deriveStatus(
      position,
      positionPrevious,
      positionChange,
      hasCurrentPosition,
      hasPreviousPosition
    );

    const valueScore = computeValueScore({
      volume,
      trafficChange,
      positionBefore: positionPrevious,
      kd,
    });

    keywords.push({
      keyword,
      volume,
      position,
      positionPrevious,
      positionChange,
      traffic,
      trafficChange,
      kd,
      url: url || selectedArticleUrl,
      status,
      valueScore,
    });
  }

  keywords.sort((a, b) => b.valueScore - a.valueScore);
  return keywords;
}

export interface ArticleKeywordStats {
  total: number;
  ranking: number;
  declined: number;
  lost: number;
  newKeywords: number;
  avgPositionChange: number;
}

export function getArticleKeywordStats(
  keywords: ArticleKeyword[]
): ArticleKeywordStats {
  const ranking = keywords.filter((k) => k.status === "ranking").length;
  const declined = keywords.filter((k) => k.status === "declined").length;
  const lost = keywords.filter((k) => k.status === "lost").length;
  const newKeywords = keywords.filter((k) => k.status === "new").length;

  const avgPositionChange =
    keywords.length > 0
      ? Math.round(
          (keywords.reduce((sum, k) => sum + k.positionChange, 0) /
            keywords.length) *
            100
        ) / 100
      : 0;

  return {
    total: keywords.length,
    ranking,
    declined,
    lost,
    newKeywords,
    avgPositionChange,
  };
}
