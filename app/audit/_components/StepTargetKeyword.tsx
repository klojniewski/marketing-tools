"use client";

import { useState, useMemo } from "react";
import type { ArticleKeyword } from "@/lib/types";

interface StepTargetKeywordProps {
  onNext: () => void;
  onBack: () => void;
  keywords: ArticleKeyword[];
  targetKeyword: string | null;
  onTargetKeywordSelected: (keyword: string | null) => void;
  articleUrl: string;
}

type SortField =
  | "valueScore"
  | "keyword"
  | "volume"
  | "position"
  | "positionChange"
  | "trafficChange";

function statusBadge(status: ArticleKeyword["status"]) {
  switch (status) {
    case "lost":
      return (
        <span className="inline-flex items-center rounded-full bg-red-900/30 px-2 py-0.5 text-xs text-red-400">
          Lost
        </span>
      );
    case "declined":
      return (
        <span className="inline-flex items-center rounded-full bg-yellow-900/30 px-2 py-0.5 text-xs text-yellow-400">
          Declined
        </span>
      );
    case "new":
      return (
        <span className="inline-flex items-center rounded-full bg-blue-900/30 px-2 py-0.5 text-xs text-blue-400">
          New
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-green-900/30 px-2 py-0.5 text-xs text-green-400">
          Ranking
        </span>
      );
  }
}

export function StepTargetKeyword({
  onNext,
  onBack,
  keywords,
  targetKeyword,
  onTargetKeywordSelected,
  articleUrl,
}: StepTargetKeywordProps) {
  const [sortField, setSortField] = useState<SortField>("valueScore");
  const [sortDesc, setSortDesc] = useState(true);
  const [filterStatus, setFilterStatus] = useState<
    "all" | ArticleKeyword["status"]
  >("all");

  const filtered = useMemo(() => {
    let result = [...keywords];
    if (filterStatus !== "all") {
      result = result.filter((k) => k.status === filterStatus);
    }
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDesc
          ? bVal.localeCompare(aVal)
          : aVal.localeCompare(bVal);
      }
      return sortDesc
        ? (bVal as number) - (aVal as number)
        : (aVal as number) - (bVal as number);
    });
    return result;
  }, [keywords, sortField, sortDesc, filterStatus]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortField(field);
      setSortDesc(true);
    }
  }

  function sortIcon(field: SortField) {
    if (sortField !== field) return null;
    return sortDesc ? " \u25BC" : " \u25B2";
  }

  const selectedKw = keywords.find((k) => k.keyword === targetKeyword);

  return (
    <div className="space-y-6">
      {/* Article context */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs text-muted mb-1">Analyzing article:</p>
        <p className="text-sm font-mono break-all">{articleUrl}</p>
      </div>

      {/* Selected keyword badge */}
      {selectedKw && (
        <div className="rounded-lg border border-white/20 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted mb-1">Target keyword:</p>
              <p className="font-semibold">{selectedKw.keyword}</p>
            </div>
            <div className="text-right text-xs text-muted space-y-0.5">
              <p>
                Vol: <span className="text-white">{selectedKw.volume}</span>
              </p>
              <p>
                Pos: <span className="text-white">{selectedKw.position}</span>{" "}
                (was {selectedKw.positionPrevious})
              </p>
              <p>
                Change:{" "}
                <span
                  className={
                    selectedKw.positionChange >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {selectedKw.positionChange >= 0 ? "+" : ""}
                  {selectedKw.positionChange}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter + table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Filter bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <span className="text-xs text-muted">Filter:</span>
          {(
            ["all", "declined", "lost", "ranking", "new"] as const
          ).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                filterStatus === s
                  ? "bg-white/10 text-white"
                  : "text-muted hover:text-white"
              }`}
            >
              {s === "all" ? `All (${keywords.length})` : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card border-b border-border">
              <tr className="text-xs text-muted">
                <th className="text-left px-4 py-2 w-8"></th>
                <th
                  className="text-left px-4 py-2 cursor-pointer hover:text-white"
                  onClick={() => toggleSort("keyword")}
                >
                  Keyword{sortIcon("keyword")}
                </th>
                <th
                  className="text-right px-4 py-2 cursor-pointer hover:text-white"
                  onClick={() => toggleSort("volume")}
                >
                  Volume{sortIcon("volume")}
                </th>
                <th
                  className="text-right px-4 py-2 cursor-pointer hover:text-white"
                  onClick={() => toggleSort("position")}
                >
                  Position{sortIcon("position")}
                </th>
                <th className="text-right px-4 py-2">Previous</th>
                <th
                  className="text-right px-4 py-2 cursor-pointer hover:text-white"
                  onClick={() => toggleSort("positionChange")}
                >
                  Change{sortIcon("positionChange")}
                </th>
                <th
                  className="text-right px-4 py-2 cursor-pointer hover:text-white"
                  onClick={() => toggleSort("trafficChange")}
                >
                  Traffic &Delta;{sortIcon("trafficChange")}
                </th>
                <th className="text-center px-4 py-2">Status</th>
                <th
                  className="text-right px-4 py-2 cursor-pointer hover:text-white"
                  onClick={() => toggleSort("valueScore")}
                >
                  Score{sortIcon("valueScore")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((kw) => {
                const isSelected = targetKeyword === kw.keyword;
                return (
                  <tr
                    key={kw.keyword}
                    onClick={() => onTargetKeywordSelected(kw.keyword)}
                    className={`cursor-pointer transition-colors border-b border-border/50 ${
                      isSelected
                        ? "bg-white/10"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <td className="px-4 py-2">
                      <div
                        className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? "border-white bg-white"
                            : "border-muted"
                        }`}
                      >
                        {isSelected && (
                          <div className="h-2 w-2 rounded-full bg-black" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 font-medium max-w-[250px] truncate">
                      {kw.keyword}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {kw.volume.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {kw.position || "—"}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-muted">
                      {kw.positionPrevious || "—"}
                    </td>
                    <td
                      className={`px-4 py-2 text-right tabular-nums font-medium ${
                        kw.positionChange > 0
                          ? "text-green-400"
                          : kw.positionChange < 0
                          ? "text-red-400"
                          : "text-muted"
                      }`}
                    >
                      {kw.positionChange > 0 ? "+" : ""}
                      {kw.positionChange}
                    </td>
                    <td
                      className={`px-4 py-2 text-right tabular-nums ${
                        kw.trafficChange > 0
                          ? "text-green-400"
                          : kw.trafficChange < 0
                          ? "text-red-400"
                          : "text-muted"
                      }`}
                    >
                      {kw.trafficChange > 0 ? "+" : ""}
                      {kw.trafficChange}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {statusBadge(kw.status)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-muted">
                      {kw.valueScore}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted py-8">
            No keywords match the current filter.
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          onClick={onBack}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-card"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!targetKeyword}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-40"
        >
          Next: Add Competitors
        </button>
      </div>
    </div>
  );
}
