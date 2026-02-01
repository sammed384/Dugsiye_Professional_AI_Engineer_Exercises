import { createTool } from "@inngest/agent-kit";
import { z } from "zod";

// Tool 1: Search for iPhone prices using Serper API
export const searchIPhonePricesTool = createTool({
  name: "search_iphone_prices",
  description:
    "Search for iPhone prices from multiple online retailers using web search",
  parameters: z.object({
    queries: z
      .array(z.string())
      .describe("Array of search queries for iPhone pricing"),
  }),

  handler: async (input, { network, step }) => {
    console.log("🔍 [iPhone Search] Starting price search...");
    console.log("   Queries:", input.queries);

    const allResults: any[] = [];

    // Execute all searches in parallel within a single step
    const searchResponses = await step?.run("batch_serper_search", async () => {
      const promises = input.queries.map(async (query) => {
        try {
          const res = await fetch("https://google.serper.dev/shopping", {
            method: "POST",
            headers: {
              "X-API-KEY": process.env.SERPER_API_KEY!,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              q: query,
              gl: "us",
              hl: "en",
              num: 5,
            }),
          });

          if (!res.ok) {
            // Fallback to regular search if shopping doesn't work
            const fallbackRes = await fetch(
              "https://google.serper.dev/search",
              {
                method: "POST",
                headers: {
                  "X-API-KEY": process.env.SERPER_API_KEY!,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  q: query,
                  gl: "us",
                  hl: "en",
                  num: 5,
                }),
              },
            );
            return { query, data: await fallbackRes.json() };
          }

          return { query, data: await res.json() };
        } catch (error) {
          console.error(`Failed search for ${query}:`, error);
          return { query, data: null };
        }
      });

      return Promise.all(promises);
    });

    // Process all responses
    if (searchResponses) {
      searchResponses.forEach(({ query, data }: any) => {
        if (!data) return;

        // Process shopping results
        if (data.shopping) {
          data.shopping.forEach((item: any) => {
            allResults.push({
              title: item.title,
              price: item.price,
              source: item.source,
              link: item.link,
              delivery: item.delivery,
            });
          });
        }

        // Process organic results that might contain pricing
        if (data.organic) {
          data.organic.forEach((item: any) => {
            if (item.snippet?.match(/\$[\d,]+/)) {
              allResults.push({
                title: item.title,
                snippet: item.snippet.substring(0, 200), // Trim snippet
                source: item.source || new URL(item.link).hostname,
                link: item.link,
              });
            }
          });
        }

        // Process knowledge graph if present
        if (data.knowledgeGraph?.price) {
          allResults.push({
            title: data.knowledgeGraph.title,
            price: data.knowledgeGraph.price,
            source: "Google Knowledge Graph",
            link: data.knowledgeGraph.descriptionLink || "",
            resultType: "knowledge_graph",
          });
        }
      });
    }

    // Store raw results in network state
    network.state.data.rawSearchResults = allResults;

    // Save to DB to ensure durability across restarts
    await step?.run("save_search_results", async () => {
      const { getDB } = await import("../db");
      const db = await getDB();
      const runId = network.state.data.runId;
      if (runId) {
        await db.collection("iphone_results").updateOne(
          { runId },
          {
            $set: {
              "state.rawSearchResults": allResults,
              "progress.iphoneScout": "completed",
              updatedAt: new Date(),
            },
          },
        );
        console.log("💾 [iPhone Search] Saved raw results to DB");
      }
    });

    console.log(`✅ [iPhone Search] Found ${allResults.length} results`);

    return { success: true, count: allResults.length };
  },
});

// Tool 2: Extract and normalize prices from search results
export const extractPricesTool = createTool({
  name: "extract_prices",
  description: "Extract and normalize iPhone pricing data from search results",
  parameters: z.object({
    parsedPrices: z.array(
      z.object({
        model: z.string().describe("iPhone model name (e.g., iPhone 15 Pro)"),
        price: z.number().describe("Price in USD"),
        seller: z.string().describe("Seller or website name"),
        url: z.string().describe("Link to the product"),
        storage: z
          .string()
          .nullable()
          .describe("Storage capacity if known, else null"),
        condition: z
          .string()
          .nullable()
          .describe("New, refurbished, etc. or null"),
        shipping: z.string().nullable().describe("Shipping info or null"),
        discount: z
          .string()
          .nullable()
          .describe("Any discount or sale info or null"),
        availability: z
          .string()
          .nullable()
          .describe("In stock, limited, etc. or null"),
      }),
    ),
  }),

  handler: async (input, { network, step }) => {
    console.log("📊 [Price Extractor] Starting handler...");
    console.log(`   Input received: ${input.parsedPrices?.length || 0} prices`);

    if (!input.parsedPrices || input.parsedPrices.length === 0) {
      console.log("⚠️ [Price Extractor] No prices parsed by the agent");
      return { success: false, count: 0 };
    }

    console.log("📊 [Price Extractor] Processing prices...");
    console.log(`   Parsed ${input.parsedPrices.length} prices`);

    // Store extracted prices in network state
    network.state.data.extractedPrices = input.parsedPrices;

    // Save to DB
    await step?.run("save_extracted_prices", async () => {
      const { getDB } = await import("../db");
      const db = await getDB();
      const runId = network.state.data.runId;

      if (runId) {
        await db.collection("iphone_results").updateOne(
          { runId, status: "running" },
          {
            $set: {
              "state.extractedPrices": input.parsedPrices,
              "progress.priceExtractor": "completed",
              updatedAt: new Date(),
            },
          },
        );
        console.log("✅ [Price Extractor] Saved to DB");
      }
    });

    return { success: true, count: input.parsedPrices.length };
  },
});

// Tool 3: Analyze prices and find the cheapest options
export const analyzePricesTool = createTool({
  name: "analyze_prices",
  description: "Analyze and compare iPhone prices to find the cheapest options",
  parameters: z.object({
    analysis: z.object({
      cheapestOverall: z.object({
        model: z.string(),
        price: z.number(),
        seller: z.string(),
        url: z.string(),
        notes: z.string().nullable(),
      }),
      cheapestByModel: z.array(
        z.object({
          category: z
            .string()
            .describe(
              "Model category like 'iPhone 14', 'iPhone 15', 'iPhone SE'",
            ),
          model: z.string(),
          price: z.number(),
          seller: z.string(),
          url: z.string(),
        }),
      ),
      allPrices: z.array(
        z.object({
          model: z.string(),
          price: z.number(),
          seller: z.string(),
          url: z.string(),
          notes: z.string().nullable(),
        }),
      ),
      summary: z
        .string()
        .describe("Short summary explaining the analysis and recommendation"),
    }),
  }),

  handler: async (input, { network, step }) => {
    console.log("🔬 [Price Analyzer] Starting handler...");

    if (!input.analysis) {
      console.log("❌ [Price Analyzer] No analysis data provided");
      return { success: false };
    }

    console.log("🔬 [Price Analyzer] Analyzing prices...");
    console.log(
      `   Cheapest overall: ${input.analysis.cheapestOverall.model} at $${input.analysis.cheapestOverall.price}`,
    );

    // Store analysis in network state
    network.state.data.priceAnalysis = input.analysis;
    network.state.data.completed = true;

    // Save to DB
    await step?.run("save_analysis", async () => {
      const { getDB } = await import("../db");
      const db = await getDB();
      const runId = network.state.data.runId;

      if (runId) {
        await db.collection("iphone_results").updateOne(
          { runId, status: "running" },
          {
            $set: {
              "state.priceAnalysis": input.analysis,
              "state.completed": true,
              "progress.priceAnalyzer": "completed",
              status: "completed",
              updatedAt: new Date(),
              completedAt: new Date(),
            },
          },
        );
        console.log("✅ [Price Analyzer] Analysis saved to DB");
      }
    });

    return { success: true, cheapest: input.analysis.cheapestOverall };
  },
});
