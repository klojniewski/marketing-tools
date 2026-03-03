import { NextResponse, type NextRequest } from "next/server";
import type { ArticleKeyword, ManualCompetitor } from "@/lib/types";
import { fetchAndExtract } from "@/lib/llm/content-fetcher";
import { callClaude } from "@/lib/llm/client";
import { SYSTEM_PROMPT, buildAnalysisPrompt } from "@/lib/llm/prompts";
import { parseAnalysisResponse } from "@/lib/llm/schemas";

interface AnalyzeRequest {
  articleUrl: string;
  targetKeyword: string;
  keywords: ArticleKeyword[];
  competitors: ManualCompetitor[];
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured." },
      { status: 500 }
    );
  }

  try {
    const body: AnalyzeRequest = await request.json();
    const { articleUrl, targetKeyword, keywords, competitors } = body;

    if (!articleUrl || !targetKeyword || !keywords?.length || !competitors?.length) {
      return NextResponse.json(
        { error: "Missing required fields: articleUrl, targetKeyword, keywords, competitors" },
        { status: 400 }
      );
    }

    // Fetch article content
    const articleContent = await fetchAndExtract(articleUrl);

    // Fetch competitor content in parallel
    const competitorContents = await Promise.all(
      competitors.map((c) => fetchAndExtract(c.url))
    );

    // Build prompt
    const userPrompt = buildAnalysisPrompt({
      articleUrl,
      articleContent,
      targetKeyword,
      keywords,
      competitors: competitorContents,
    });

    // Call Claude
    const llmResponse = await callClaude(SYSTEM_PROMPT, userPrompt);

    // Parse and validate response
    const analysis = parseAnalysisResponse(llmResponse.content);

    return NextResponse.json({
      analysis,
      meta: {
        inputTokens: llmResponse.inputTokens,
        outputTokens: llmResponse.outputTokens,
        articleFetched: !articleContent.fetchError,
        competitorsFetched: competitorContents.filter((c) => !c.fetchError).length,
        competitorsFailed: competitorContents.filter((c) => c.fetchError).length,
      },
    });
  } catch (error) {
    console.error("Analysis error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse AI response. The analysis may have been too complex. Please try again." },
        { status: 502 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Analysis failed: ${message}` },
      { status: 500 }
    );
  }
}
