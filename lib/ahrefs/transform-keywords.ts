import type { LostKeyword } from "@/lib/types";
import { matchKeywordToPage } from "./match-urls";
import { computeValueScore, detectJunk } from "./scoring";

/**
 * Column mapping from Ahrefs "Organic Keywords" export:
 *   "Keyword" → keyword
 *   "Volume" → volume
 *   "Previous organic traffic" → trafficBefore
 *   "Current organic traffic" → traffic
 *   "Organic traffic change" → trafficChange
 *   "Previous average position" → positionBefore
 *   "Current average position" → position
 *   KD → not in this export, defaults to undefined
 */

function parseNum(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/[",]/g, "").trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

export function transformToKeywords(
  rows: Record<string, string>[],
  candidateUrls: string[]
): LostKeyword[] {
  const keywords: LostKeyword[] = [];

  for (const row of rows) {
    const keyword = (row["Keyword"] || "").replace(/^"|"$/g, "").trim();
    if (!keyword) continue;

    const volume = parseNum(row["Volume"]);
    const traffic = parseNum(row["Current organic traffic"]);
    const trafficChange = parseNum(row["Organic traffic change"]);
    const positionBefore = parseNum(row["Previous average position"]);
    const position = parseNum(row["Current average position"]);

    // Check for KD column (some exports include it)
    const kdRaw = row["Keyword Difficulty"] || row["KD"];
    const kd = kdRaw ? parseNum(kdRaw) : undefined;

    const candidateUrl =
      matchKeywordToPage(keyword, candidateUrls) || "unassigned";

    const valueScore = computeValueScore({
      volume,
      trafficChange,
      positionBefore,
      kd,
    });

    const { isJunk, junkReason } = detectJunk({ volume, kd, keyword });

    keywords.push({
      keyword,
      volume,
      position,
      positionBefore,
      traffic,
      trafficChange,
      kd,
      valueScore,
      isJunk,
      junkReason,
      isSelected: !isJunk,
      candidateUrl,
    });
  }

  // Sort by value score descending
  keywords.sort((a, b) => b.valueScore - a.valueScore);

  return keywords;
}

export interface KeywordMatchStats {
  total: number;
  matched: number;
  unmatched: number;
}

export function getMatchStats(keywords: LostKeyword[]): KeywordMatchStats {
  const matched = keywords.filter((k) => k.candidateUrl !== "unassigned").length;
  return {
    total: keywords.length,
    matched,
    unmatched: keywords.length - matched,
  };
}
