"use client";

import { useState } from "react";
import { mockGSCSites } from "@/lib/mock-data";
import { InfoCallout } from "./InfoCallout";

export function StepGSCConnect({ onNext }: { onNext: () => void }) {
  const [isConnected, setIsConnected] = useState(false);
  const [selectedSite, setSelectedSite] = useState("");

  function handleConnect() {
    // Mock OAuth flow — just flip the state
    setIsConnected(true);
    setSelectedSite(mockGSCSites[0].siteUrl);
  }

  return (
    <div className="space-y-6">
      <InfoCallout title="Why do we need Google Search Console?">
        <p>
          GSC provides the raw performance data for your blog posts — impressions,
          clicks, average position, and CTR. We compare two time periods to find
          pages that are <strong>losing visibility</strong>. This is the foundation
          of the entire audit: without GSC data, we can&apos;t identify which pages
          need attention.
        </p>
      </InfoCallout>

      {!isConnected ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Connect your Google account</h3>
          <p className="text-sm text-muted mb-6 max-w-md mx-auto">
            We&apos;ll request read-only access to your Search Console data. We never
            modify your settings or submit anything on your behalf.
          </p>
          <button
            onClick={handleConnect}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
          <p className="text-xs text-muted mt-4">
            Scopes requested: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">webmasters.readonly</code>
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-emerald-800">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span className="font-medium">Connected to Google Search Console</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Select a GSC Property
            </label>
            <p className="text-sm text-muted mb-3">
              Choose the property that contains your blog. Domain properties
              (sc-domain:) cover all subdomains, while URL-prefix properties
              match an exact URL prefix.
            </p>
            <div className="space-y-2">
              {mockGSCSites.map((site) => (
                <label
                  key={site.siteUrl}
                  className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                    selectedSite === site.siteUrl
                      ? "border-accent bg-blue-50"
                      : "border-border bg-card hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="gsc-site"
                    value={site.siteUrl}
                    checked={selectedSite === site.siteUrl}
                    onChange={() => setSelectedSite(site.siteUrl)}
                    className="accent-accent"
                  />
                  <div>
                    <div className="font-medium text-sm">{site.siteUrl}</div>
                    <div className="text-xs text-muted">
                      Permission: {site.permissionLevel === "siteOwner" ? "Owner" : "Full User"}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onNext}
              disabled={!selectedSite}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next: Configure Periods
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
