import { z } from "zod";
import type { ArticleAnalysis } from "@/lib/types";

const keywordClusterSchema = z.object({
  cluster: z.string(),
  keywords: z.array(z.string()),
  avgPositionChange: z.number(),
  trend: z.enum(["declining", "stable", "improving"]),
});

const intentAnalysisSchema = z.object({
  currentIntent: z.string(),
  mismatchDetected: z.boolean(),
  explanation: z.string(),
});

const diagnosisSchema = z.object({
  summary: z.string(),
  keywordClusters: z.array(keywordClusterSchema),
  intentAnalysis: intentAnalysisSchema,
  topicalGaps: z.array(z.string()),
  eeatIssues: z.array(z.string()),
  serpFeatureNotes: z.array(z.string()),
});

const competitorAnalysisItemSchema = z.object({
  url: z.string(),
  headingStructure: z.array(
    z.object({ tag: z.string(), text: z.string() })
  ),
  coveredSubtopics: z.array(z.string()),
  missingFromOurs: z.array(z.string()),
  hasFAQ: z.boolean(),
  hasTLDR: z.boolean(),
  internalLinkCount: z.number(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  contentStrengths: z.array(z.string()),
});

const recommendationSchema = z.object({
  category: z.enum([
    "heading-restructure",
    "missing-content",
    "faq",
    "featured-snippet",
    "tldr",
    "cross-linking",
    "meta-tags",
    "eeat",
    "aeo",
  ]),
  priority: z.enum(["high", "medium", "low"]),
  title: z.string(),
  details: z.string(),
  rationale: z.string(),
});

export const articleAnalysisSchema = z.object({
  articleUrl: z.string(),
  targetKeyword: z.string(),
  diagnosis: diagnosisSchema,
  competitorAnalysis: z.array(competitorAnalysisItemSchema),
  recommendations: z.array(recommendationSchema),
  suggestedTitle: z.string(),
  suggestedMeta: z.string(),
  estimatedEffort: z.enum(["Small", "Medium", "Large"]),
  recoveryLikelihood: z.enum(["High", "Medium", "Low"]),
});

export function parseAnalysisResponse(raw: string): ArticleAnalysis {
  // Try to extract JSON from the response (handle markdown code blocks)
  let jsonStr = raw.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);
  return articleAnalysisSchema.parse(parsed) as ArticleAnalysis;
}
