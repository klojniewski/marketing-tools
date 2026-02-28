import type { AuditConfig } from "@/lib/types";

interface DateRange {
  startDate: string;
  endDate: string;
}

export interface PeriodRanges {
  periodA: DateRange; // Recent period
  periodB: DateRange; // Baseline (older) period
}

/**
 * Computes Period A (recent) and Period B (baseline) date ranges
 * based on the comparison mode. End date is auto-adjusted to 3 days ago
 * to account for GSC data processing delay.
 */
export function computeDateRanges(
  comparisonMode: AuditConfig["comparisonMode"]
): PeriodRanges {
  const now = new Date();
  // GSC data has a ~3 day lag
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() - 3);

  const fmt = (d: Date) => d.toISOString().split("T")[0];

  if (comparisonMode === "28d") {
    const periodAStart = new Date(endDate);
    periodAStart.setDate(periodAStart.getDate() - 27);

    const periodBEnd = new Date(periodAStart);
    periodBEnd.setDate(periodBEnd.getDate() - 1);

    const periodBStart = new Date(periodBEnd);
    periodBStart.setDate(periodBStart.getDate() - 27);

    return {
      periodA: { startDate: fmt(periodAStart), endDate: fmt(endDate) },
      periodB: { startDate: fmt(periodBStart), endDate: fmt(periodBEnd) },
    };
  }

  if (comparisonMode === "90d") {
    const periodAStart = new Date(endDate);
    periodAStart.setDate(periodAStart.getDate() - 89);

    const periodBEnd = new Date(periodAStart);
    periodBEnd.setDate(periodBEnd.getDate() - 1);

    const periodBStart = new Date(periodBEnd);
    periodBStart.setDate(periodBStart.getDate() - 89);

    return {
      periodA: { startDate: fmt(periodAStart), endDate: fmt(endDate) },
      periodB: { startDate: fmt(periodBStart), endDate: fmt(periodBEnd) },
    };
  }

  // Year-over-year: Period A = last 90 days, Period B = same 90 days one year ago
  if (comparisonMode === "yoy") {
    const periodAStart = new Date(endDate);
    periodAStart.setDate(periodAStart.getDate() - 89);

    const periodBEnd = new Date(endDate);
    periodBEnd.setFullYear(periodBEnd.getFullYear() - 1);

    const periodBStart = new Date(periodAStart);
    periodBStart.setFullYear(periodBStart.getFullYear() - 1);

    return {
      periodA: { startDate: fmt(periodAStart), endDate: fmt(endDate) },
      periodB: { startDate: fmt(periodBStart), endDate: fmt(periodBEnd) },
    };
  }

  throw new Error(`Unknown comparison mode: ${comparisonMode}`);
}
