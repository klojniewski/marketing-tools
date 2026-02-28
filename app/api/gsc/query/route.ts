import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { fetchAndCompare } from "@/lib/gsc/comparison";
import { applyAllFilters } from "@/lib/analysis/filters";
import type { AuditConfig } from "@/lib/types";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Not authenticated. Please sign in with Google first." },
      { status: 401 }
    );
  }

  try {
    const config: AuditConfig = await request.json();

    // Fetch and compare both periods
    const rawCandidates = await fetchAndCompare(
      session.accessToken,
      config
    );

    // Apply all filters
    const candidates = applyAllFilters(rawCandidates, {
      blogUrlPattern: config.blogUrlPattern,
      impressionThreshold: config.impressionThreshold,
      clicksDropThreshold: config.clicksDropThreshold,
      topicPatterns: config.topicPatterns,
    });

    return NextResponse.json({
      candidates,
      meta: {
        totalRawPages: rawCandidates.length,
        filteredPages: candidates.length,
        periodA: { start: config.periodAStart, end: config.periodAEnd },
        periodB: { start: config.periodBStart, end: config.periodBEnd },
      },
    });
  } catch (error) {
    console.error("Error querying GSC:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to query GSC: ${message}` },
      { status: 500 }
    );
  }
}
