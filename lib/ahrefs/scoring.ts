/**
 * Value score calculation for keyword prioritization.
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
