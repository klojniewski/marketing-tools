import type { ArticleKeyword } from "@/lib/types";
import type { ExtractedContent } from "./content-fetcher";

export const SYSTEM_PROMPT = `You are an expert SEO analyst specializing in content recovery and optimization. You analyze declining articles by examining keyword data, competitor content, and search intent to produce actionable recommendations.

Your analysis must be structured, evidence-based, and directly actionable. Avoid generic advice — every recommendation should reference specific data from the keyword metrics or competitor content provided.

You must respond with valid JSON matching the exact schema described in the user prompt. Do not include any text before or after the JSON object.`;

export function buildAnalysisPrompt(params: {
  articleUrl: string;
  articleContent: ExtractedContent;
  targetKeyword: string;
  keywords: ArticleKeyword[];
  competitors: ExtractedContent[];
}): string {
  const { articleUrl, articleContent, targetKeyword, keywords, competitors } =
    params;

  // Summarize keywords (top 50 by value score to fit context)
  const topKeywords = keywords.slice(0, 50);
  const keywordSummary = topKeywords
    .map(
      (k) =>
        `- "${k.keyword}" | vol:${k.volume} | pos:${k.position} (was ${k.positionPrevious}, Δ${k.positionChange}) | traffic Δ:${k.trafficChange} | status:${k.status}`
    )
    .join("\n");

  const declinedCount = keywords.filter((k) => k.status === "declined").length;
  const lostCount = keywords.filter((k) => k.status === "lost").length;

  // Article content summary
  const articleHeadings = articleContent.headings
    .map((h) => `  ${h.tag}: ${h.text}`)
    .join("\n");

  // Competitor summaries
  const competitorSections = competitors
    .map((c, i) => {
      if (c.fetchError) {
        return `### Competitor ${i + 1}: ${c.url}\nFetch failed: ${c.fetchError}`;
      }
      const headings = c.headings.map((h) => `  ${h.tag}: ${h.text}`).join("\n");
      return `### Competitor ${i + 1}: ${c.url}
Title: ${c.title}
Meta Description: ${c.metaDescription}
Word Count: ${c.wordCount}
Internal Links: ${c.internalLinks.length}
Has FAQ: ${c.hasFAQ}
Has TL;DR: ${c.hasTLDR}
Headings:
${headings}

Content excerpt (first 3000 chars):
${c.bodyText.slice(0, 3000)}`;
    })
    .join("\n\n");

  return `Analyze the following declining article and produce a comprehensive SEO recovery plan.

## Article Under Analysis
URL: ${articleUrl}
Title: ${articleContent.title}
Meta Description: ${articleContent.metaDescription}
Word Count: ${articleContent.wordCount}
Internal Links: ${articleContent.internalLinks.length}
Has FAQ: ${articleContent.hasFAQ}
Has TL;DR: ${articleContent.hasTLDR}

### Article Headings:
${articleHeadings}

### Article Content Excerpt (first 3000 chars):
${articleContent.bodyText.slice(0, 3000)}

## Target Keyword: "${targetKeyword}"

## Keyword Data (${keywords.length} total, ${declinedCount} declined, ${lostCount} lost)
${keywordSummary}

## Competitor Content
${competitorSections}

## Required Output

Respond with a JSON object matching this exact structure:

{
  "articleUrl": "${articleUrl}",
  "targetKeyword": "${targetKeyword}",
  "diagnosis": {
    "summary": "2-3 sentence overview of why this article is declining",
    "keywordClusters": [
      {
        "cluster": "cluster name",
        "keywords": ["keyword1", "keyword2"],
        "avgPositionChange": -5.2,
        "trend": "declining"
      }
    ],
    "intentAnalysis": {
      "currentIntent": "informational/transactional/navigational",
      "mismatchDetected": false,
      "explanation": "explanation of intent alignment"
    },
    "topicalGaps": ["gap 1", "gap 2"],
    "eeatIssues": ["issue 1"],
    "serpFeatureNotes": ["note about SERP features based on CTR patterns"]
  },
  "competitorAnalysis": [
    {
      "url": "competitor url",
      "headingStructure": [{"tag": "h1", "text": "heading text"}],
      "coveredSubtopics": ["subtopic 1"],
      "missingFromOurs": ["subtopic we don't cover"],
      "hasFAQ": true,
      "hasTLDR": false,
      "internalLinkCount": 15,
      "metaTitle": "their title",
      "metaDescription": "their description",
      "contentStrengths": ["what they do well"]
    }
  ],
  "recommendations": [
    {
      "category": "missing-content",
      "priority": "high",
      "title": "Add section on X",
      "details": "specific details of what to add",
      "rationale": "why this will help recovery"
    }
  ],
  "suggestedTitle": "improved title tag",
  "suggestedMeta": "improved meta description",
  "estimatedEffort": "Medium",
  "recoveryLikelihood": "High"
}

Categories must be one of: heading-restructure, missing-content, faq, featured-snippet, tldr, cross-linking, meta-tags, eeat, aeo
Priority must be: high, medium, or low
Trend must be: declining, stable, or improving
Estimated effort: Small, Medium, or Large
Recovery likelihood: High, Medium, or Low

Be specific and actionable. Reference actual keyword data and competitor content in your analysis.`;
}
