import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-2xl text-center px-6">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent-light px-4 py-1.5 text-sm font-medium text-accent">
            SEO Audit Tool
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Find &amp; fix declining blog posts
        </h1>
        <p className="text-lg text-muted mb-8 leading-relaxed">
          Connect Google Search Console, identify pages losing traffic, import
          Ahrefs data, and get AI-powered recommendations to recover your
          rankings.
        </p>
        <Link
          href="/audit"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          Start Content Audit
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 12L10 8L6 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        <div className="mt-16 grid grid-cols-3 gap-6 text-left">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="text-sm font-semibold mb-1">Stage 1</div>
            <div className="text-sm text-muted">
              Fetch GSC data, filter declining pages, identify important topics
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="text-sm font-semibold mb-1">Stage 2</div>
            <div className="text-sm text-muted">
              Import Ahrefs CSV data, score lost keywords, analyze competitors
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="text-sm font-semibold mb-1">Stage 3</div>
            <div className="text-sm text-muted">
              AI-powered content gap analysis with actionable update plans
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
