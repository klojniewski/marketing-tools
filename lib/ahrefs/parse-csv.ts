import Papa from "papaparse";

export type AhrefsFileType = "organic-keywords" | "backlinks" | "unknown";

export interface ParsedCSV {
  fileType: AhrefsFileType;
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
  fileName: string;
}

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
