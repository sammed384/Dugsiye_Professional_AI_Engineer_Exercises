import { getDB } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  try {
    const { runId } = await params;

    if (!runId) {
      return NextResponse.json({ error: "Missing runId" }, { status: 400 });
    }

    const db = await getDB();
    const result = await db.collection("iphone_results").findOne({ runId });

    if (!result) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    return NextResponse.json({
      runId: result.runId,
      status: result.status,
      progress: result.progress,
      state: result.state,
      createdAt: result.createdAt,
      completedAt: result.completedAt,
      error: result.error,
    });
  } catch (error) {
    console.error("Error fetching iPhone results:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
