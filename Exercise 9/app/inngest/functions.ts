import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import { newsAnalysisNetwork } from "@/lib/network";
import { iphonePriceNetwork } from "@/lib/iphoneNetwork";
import { getDB } from "@/lib/db";

export const newsAnalysisWorkflow = inngest.createFunction(
  { id: "news-analysis-workflow" },
  { event: "ai.agents/run" },
  async ({ event, step }) => {
    const input = event.data.input;
    const runId = event.data.runId;
    const limit = input.limit || 1;

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🤖 [Inngest] Starting agents in background");
    console.log("   Input:", input);
    console.log("   RunId:", runId);
    console.log("   Limit:", limit);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    try {
      const result = await newsAnalysisNetwork.run(input, {
        step,
        state: {
          data: { runId, limit },
        },
      });

      return {
        status: "success",
        result: result.state.data,
      };
    } catch (error) {
      console.log("❌ [Inngest] Error running agents", error);

      try {
        const db = await getDB();
        await db.collection("results").updateOne(
          { runId, status: "running" },
          {
            $set: {
              status: "failed",
              error: error instanceof Error ? error.message : "Unknown error",
              failedAt: new Date(),
            },
          },
        );
      } catch (error) {
        console.error("Failed to save error:", error);
      }
      throw error;
    }
  },
);

// iPhone Price Search Workflow
export const iphonePriceSearchWorkflow = inngest.createFunction(
  { id: "iphone-price-search-workflow" },
  { event: "ai.iphone/search" },
  async ({ event, step }) => {
    const runId = event.data.runId;

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📱 [Inngest] Starting iPhone price search");
    console.log("   RunId:", runId);
    console.log("   Step object exists:", !!step);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    try {
      // Restore state from DB to survive Inngest restarts
      const db = await getDB();
      const existingRun = await db
        .collection("iphone_results")
        .findOne({ runId });

      const restoredState = {
        data: {
          runId,
          rawSearchResults: existingRun?.state?.rawSearchResults || [],
          extractedPrices: existingRun?.state?.extractedPrices || [],
          priceAnalysis: existingRun?.state?.priceAnalysis || null,
          completed: existingRun?.state?.completed || false,
        },
        threadId: runId, // CRITICAL: This enables HistoryConfig.get()
      };

      console.log(
        `📡 [Inngest] Handing off to network. State: ${restoredState.data.rawSearchResults.length} results, ${restoredState.data.extractedPrices.length} prices`,
      );

      const result = await iphonePriceNetwork.run(
        "Find the cheapest iPhone prices online",
        {
          step,
          state: restoredState,
        },
      );

      return {
        status: "success",
        result: result.state.data,
      };
    } catch (error) {
      console.log("❌ [Inngest] Error running iPhone search:", error);

      try {
        const db = await getDB();
        await db.collection("iphone_results").updateOne(
          { runId, status: "running" },
          {
            $set: {
              status: "failed",
              error: error instanceof Error ? error.message : "Unknown error",
              failedAt: new Date(),
            },
          },
        );
      } catch (dbError) {
        console.error("Failed to save error:", dbError);
      }
      throw error;
    }
  },
);
