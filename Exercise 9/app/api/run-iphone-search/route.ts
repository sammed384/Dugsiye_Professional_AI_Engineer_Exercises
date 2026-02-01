import { inngest } from "@/app/inngest/client";
import { getDB } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const runId = `iphone_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    console.log("📝 [iPhone API] Generated runId:", runId);

    // Save initial status to MongoDB
    try {
      const db = await getDB();
      const insertResult = await db.collection("iphone_results").insertOne({
        runId,
        status: "running",
        progress: {},
        state: {},
        createdAt: new Date(),
      });
      console.log(
        "✅ [iPhone API] Initial DB record created:",
        insertResult.insertedId,
      );
    } catch (dbError) {
      console.error("❌ [iPhone API] MongoDB error:", dbError);
      throw dbError;
    }

    // Trigger Inngest workflow
    await inngest.send({
      name: "ai.iphone/search",
      data: {
        runId,
      },
    });

    return NextResponse.json({
      status: "running",
      runId,
      message: "iPhone price search running in background",
    });
  } catch (error) {
    console.error("Error running iPhone search:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
