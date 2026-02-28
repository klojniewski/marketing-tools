import { google, type searchconsole_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";

/**
 * Creates an authenticated Google Search Console client.
 */
export function getGSCClient(accessToken: string): {
  oauth2Client: OAuth2Client;
  searchconsole: searchconsole_v1.Searchconsole;
} {
  const oauth2Client = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET
  );
  oauth2Client.setCredentials({ access_token: accessToken });

  const searchconsole = google.searchconsole({
    version: "v1",
    auth: oauth2Client,
  });

  return { oauth2Client, searchconsole };
}

export interface GSCSite {
  siteUrl: string;
  permissionLevel: string;
}

/**
 * Fetches all GSC properties the user has access to.
 */
export async function listSites(accessToken: string): Promise<GSCSite[]> {
  const { searchconsole } = getGSCClient(accessToken);

  const response = await searchconsole.sites.list();
  const sites = response.data.siteEntry ?? [];

  return sites.map((site) => ({
    siteUrl: site.siteUrl ?? "",
    permissionLevel: site.permissionLevel ?? "siteUnverifiedUser",
  }));
}

export interface SearchAnalyticsParams {
  siteUrl: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dimensions?: string[];
  rowLimit?: number;
}

export interface SearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/**
 * Queries the Search Analytics API with pagination to fetch all rows.
 * GSC API limits to 25,000 rows per request, so we paginate.
 */
export async function querySearchAnalytics(
  accessToken: string,
  params: SearchAnalyticsParams
): Promise<SearchAnalyticsRow[]> {
  const { searchconsole } = getGSCClient(accessToken);

  const rowLimit = params.rowLimit ?? 25000;
  const allRows: SearchAnalyticsRow[] = [];
  let startRow = 0;

  while (true) {
    const response = await searchconsole.searchanalytics.query({
      siteUrl: params.siteUrl,
      requestBody: {
        startDate: params.startDate,
        endDate: params.endDate,
        dimensions: params.dimensions ?? ["page"],
        rowLimit,
        startRow,
        dataState: "final",
      },
    });

    const rows = response.data.rows ?? [];
    if (rows.length === 0) break;

    for (const row of rows) {
      allRows.push({
        keys: row.keys ?? [],
        clicks: row.clicks ?? 0,
        impressions: row.impressions ?? 0,
        ctr: row.ctr ?? 0,
        position: row.position ?? 0,
      });
    }

    // If we got fewer rows than the limit, we've fetched everything
    if (rows.length < rowLimit) break;
    startRow += rowLimit;
  }

  return allRows;
}
