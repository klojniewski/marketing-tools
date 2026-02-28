/**
 * Match keywords to candidate pages via URL slug heuristic.
 *
 * Since Ahrefs organic keywords export is domain-level (no URL column),
 * we match by checking if keyword tokens appear in candidate URL slugs.
 */

export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname.replace(/\/$/, "").toLowerCase();
  } catch {
    return url.replace(/\/$/, "").toLowerCase();
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/[\s-]+/)
    .filter((t) => t.length > 1);
}

function extractSlugTokens(url: string): string[] {
  const path = normalizeUrl(url);
  const slug = path.split("/").pop() || "";
  return tokenize(slug);
}

export function matchKeywordToPage(
  keyword: string,
  candidateUrls: string[]
): string | null {
  const kwTokens = tokenize(keyword);
  if (kwTokens.length === 0) return null;

  let bestUrl: string | null = null;
  let bestScore = 0;

  for (const url of candidateUrls) {
    const slugTokens = extractSlugTokens(url);
    if (slugTokens.length === 0) continue;

    // Count how many keyword tokens appear in the slug
    const matches = kwTokens.filter((t) => slugTokens.includes(t)).length;
    const score = matches / kwTokens.length;

    if (score > bestScore) {
      bestScore = score;
      bestUrl = url;
    }
  }

  // Require at least 40% token overlap
  return bestScore >= 0.4 ? bestUrl : null;
}
