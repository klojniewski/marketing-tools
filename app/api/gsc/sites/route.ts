import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listSites } from "@/lib/gsc/client";

export async function GET() {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Not authenticated. Please sign in with Google first." },
      { status: 401 }
    );
  }

  try {
    const sites = await listSites(session.accessToken);
    return NextResponse.json({ sites });
  } catch (error) {
    console.error("Error fetching GSC sites:", error);
    return NextResponse.json(
      { error: "Failed to fetch GSC properties. Please try signing in again." },
      { status: 500 }
    );
  }
}
