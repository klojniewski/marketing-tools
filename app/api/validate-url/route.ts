import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; SEOAuditTool/1.0; +https://seo-analyzer-nine-hazel.vercel.app)",
        },
      });

      clearTimeout(timeout);

      // If HEAD didn't return useful info, try GET for title
      let title: string | undefined;
      if (res.ok) {
        try {
          const getRes = await fetch(url, {
            method: "GET",
            redirect: "follow",
            signal: AbortSignal.timeout(10000),
            headers: {
              "User-Agent":
                "Mozilla/5.0 (compatible; SEOAuditTool/1.0; +https://seo-analyzer-nine-hazel.vercel.app)",
            },
          });
          const html = await getRes.text();
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch) {
            title = titleMatch[1].trim().slice(0, 200);
          }
        } catch {
          // Title extraction is best-effort
        }
      }

      return NextResponse.json({
        reachable: res.ok,
        statusCode: res.status,
        finalUrl: res.url,
        title,
      });
    } catch (err) {
      clearTimeout(timeout);
      const message =
        err instanceof Error ? err.message : "Request failed";
      return NextResponse.json({
        reachable: false,
        error: message.includes("abort")
          ? "Request timed out (10s)"
          : message,
      });
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
