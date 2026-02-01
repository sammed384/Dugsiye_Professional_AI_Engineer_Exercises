import { config } from "dotenv";
import { createNetwork, State } from "@inngest/agent-kit";
import { priceExtractorAgent } from "./lib/iphoneAgents";

// Load env vars
config();

async function runTest() {
  console.log("🚀 Starting local agent test...");

  // Mock input data (1 item, as per current failure state)
  const mockRawResults = [
    {
      title: "Apple iPhone 15 128GB Black - Best Buy",
      link: "https://www.bestbuy.com/site/apple-iphone-15-128gb-black/6554800.p?skuId=6554800",
      snippet:
        "Shop Apple iPhone 15 128GB Black at Best Buy. Find low everyday prices and buy online for delivery or in-store pick-up. Price Match Guarantee.",
      price: "$799.00",
      source: "Best Buy",
    },
  ];

  // Create a minimal network to host the agent
  const testNetwork = createNetwork({
    name: "test-network",
    agents: [priceExtractorAgent],
    defaultModel: priceExtractorAgent.model, // Reuse model config
  });

  // Mock state with the raw results
  const mockState = new State();
  mockState.data = {
    runId: "test-run-123",
    rawSearchResults: mockRawResults,
    extractedPrices: [],
  };

  try {
    console.log("🔄 Running network with mocked state...");

    // We execute the network.
    // Since there is only one agent and the router is default (sequential?),
    // we need to see if it picks up the agent.
    // Actually, createNetwork requires a router usually, or defaults to LLM router.
    // For specific agent testing, we can try to run the agent directly if exposed?
    // But agent-kit API is usually network.run().

    // Let's rely on the fact that our agent SYSTEM PROMPT uses the state.
    // So we just need to ensure the agent is called.

    // We can force routing by creating a custom router or just asking it to "extract prices".
    const result = await testNetwork.run(
      "Extract prices from the search results",
      {
        state: mockState,
      },
    );

    console.log("✅ Test completed successfully!");
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error("________________ERROR________________");
    console.error(error.message);
    if (error.response) {
      console.error(
        "Response data:",
        JSON.stringify(error.response.data || {}, null, 2),
      );
    }
    console.error("Stack:", error.stack);
    console.error("________________End ERROR________________");
    process.exit(1);
  }
}

runTest();
