import * as cheerio from "cheerio";

export interface ExtractedContent {
  url: string;
  title: string;
  metaDescription: string;
  headings: { tag: string; text: string }[];
  bodyText: string;
  internalLinks: string[];
  hasFAQ: boolean;
  hasTLDR: boolean;
  wordCount: number;
  fetchError?: string;
}

const USER_AGENT =
  "Mozilla/5.0 (compatible; SEOAuditTool/1.0; +https://seo-analyzer-nine-hazel.vercel.app)";

export async function fetchAndExtract(url: string): Promise<ExtractedContent> {
  const empty: ExtractedContent = {
    url,
    title: "",
    metaDescription: "",
    headings: [],
    bodyText: "",
    internalLinks: [],
    hasFAQ: false,
    hasTLDR: false,
    wordCount: 0,
  };

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });

    if (!res.ok) {
      return { ...empty, fetchError: `HTTP ${res.status}` };
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove noise elements
    $(
      "script, style, nav, footer, header, iframe, noscript, .sidebar, .nav, .footer, .header, .ad, .advertisement, [role='navigation'], [role='banner'], [role='contentinfo']"
    ).remove();

    // Title
    const title =
      $("title").first().text().trim() ||
      $("h1").first().text().trim() ||
      "";

    // Meta description
    const metaDescription =
      $('meta[name="description"]').attr("content")?.trim() || "";

    // Headings
    const headings: { tag: string; text: string }[] = [];
    $("h1, h2, h3, h4, h5, h6").each((_, el) => {
      const tag = $(el).prop("tagName")?.toLowerCase() || "h2";
      const text = $(el).text().trim();
      if (text) headings.push({ tag, text });
    });

    // Body text
    const mainContent =
      $("main, article, [role='main'], .content, .post-content, .entry-content")
        .first()
        .text() || $("body").text();
    const bodyText = mainContent
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 15000); // Limit to ~15k chars for LLM context

    // Internal links
    const baseUrl = new URL(url);
    const internalLinks: string[] = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      try {
        const linkUrl = new URL(href, url);
        if (linkUrl.hostname === baseUrl.hostname) {
          internalLinks.push(linkUrl.pathname);
        }
      } catch {
        // skip invalid URLs
      }
    });
    const uniqueInternalLinks = [...new Set(internalLinks)];

    // FAQ detection
    const hasFAQ =
      $('[itemtype*="FAQPage"]').length > 0 ||
      headings.some(
        (h) =>
          h.text.toLowerCase().includes("faq") ||
          h.text.toLowerCase().includes("frequently asked")
      ) ||
      $("details, .faq, .accordion").length > 0;

    // TL;DR detection
    const hasTLDR = headings.some(
      (h) =>
        h.text.toLowerCase().includes("tl;dr") ||
        h.text.toLowerCase().includes("tldr") ||
        h.text.toLowerCase().includes("summary") ||
        h.text.toLowerCase().includes("key takeaway")
    );

    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

    return {
      url,
      title,
      metaDescription,
      headings,
      bodyText,
      internalLinks: uniqueInternalLinks,
      hasFAQ,
      hasTLDR,
      wordCount,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown fetch error";
    return { ...empty, fetchError: msg };
  }
}
