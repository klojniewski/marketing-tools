import Papa from "papaparse";

export type AhrefsFileType =
  | "article-keywords"
  | "organic-keywords"
  | "backlinks"
  | "unknown";

export interface ParsedCSV {
  fileType: AhrefsFileType;
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
  fileName: string;
}

// Article-level Ahrefs export: has "Current position" + "URL" columns
const ARTICLE_KEYWORDS_MARKERS = [
  "Keyword",
  "Volume",
  "Current position",
  "URL",
];

// Domain-level Ahrefs export: has "Current average position" (no URL column)
const ORGANIC_KEYWORDS_MARKERS = [
  "Keyword",
  "Volume",
  "Current organic traffic",
];

const BACKLINKS_MARKERS = [
  "Referring page URL",
  "Domain rating",
  "Target URL",
];

export function detectFileType(headers: string[]): AhrefsFileType {
  const normalized = headers.map((h) => h.replace(/^"|"$/g, "").trim());
  // Check article-level first (more specific — has URL column)
  if (ARTICLE_KEYWORDS_MARKERS.every((m) => normalized.includes(m)))
    return "article-keywords";
  if (ORGANIC_KEYWORDS_MARKERS.every((m) => normalized.includes(m)))
    return "organic-keywords";
  if (BACKLINKS_MARKERS.every((m) => normalized.includes(m)))
    return "backlinks";
  return "unknown";
}

export function parseAhrefsCSV(file: File): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const headers = results.meta.fields || [];
        const fileType = detectFileType(headers);
        resolve({
          fileType,
          headers,
          rows: results.data as Record<string, string>[],
          rowCount: results.data.length,
          fileName: file.name,
        });
      },
      error(err) {
        reject(new Error(`Failed to parse ${file.name}: ${err.message}`));
      },
    });
  });
}
