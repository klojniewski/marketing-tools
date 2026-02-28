/**
 * Value score calculation and junk keyword detection.
 *
 * Score = (Volume × 0.4) + (|TrafficLoss| × 0.5) + (PositionBefore × 0.1) − (KD × 0.05 if available)
 */

export function computeValueScore(kw: {
  volume: number;
  trafficChange: number;
  positionBefore: number;
  kd?: number;
}): number {
  const base =
    kw.volume * 0.4 +
    Math.abs(kw.trafficChange) * 0.5 +
    kw.positionBefore * 0.1;
  const kdPenalty = kw.kd != null ? kw.kd * 0.05 : 0;
  return Math.round((base - kdPenalty) * 100) / 100;
}

export function detectJunk(kw: {
  volume: number;
  kd?: number;
  keyword: string;
}): { isJunk: boolean; junkReason: string | null } {
  if (kw.volume < 100) {
    return {
      isJunk: true,
      junkReason: "Volume < 100 — insufficient search demand",
    };
  }
  if (kw.kd != null && kw.kd > 65) {
    return {
      isJunk: true,
      junkReason: "KD > 65 — very high competition, unlikely to recover",
    };
  }
  return { isJunk: false, junkReason: null };
}
