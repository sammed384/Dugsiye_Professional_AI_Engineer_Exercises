import { createNetwork, createRoutingAgent, openai } from "@inngest/agent-kit";
import {
  iphoneScoutAgent,
  priceExtractorAgent,
  priceAnalyzerAgent,
} from "./iphoneAgents";
import { createTool } from "@inngest/agent-kit";
import { z } from "zod";

// Router tools for iPhone price search workflow
const routeToIPhoneAgentTool = createTool({
  name: "route_to_agent",
  description: "Route to the next agent in the iPhone price search workflow",
  parameters: z.object({
    agent_name: z.string().describe("The name of the agent to route to"),
    reasoning: z.string().describe("The reasoning for routing to this agent"),
  }),
  handler: async ({ agent_name, reasoning }, { network }) => {
    console.log("📍 [iPhone Supervisor] Routing to:", agent_name);
    console.log("   Reason:", reasoning);

    if (!network) {
      throw new Error("Network not available");
    }

    const agent = network.agents.get(agent_name);
    if (!agent) {
      throw new Error(`Agent ${agent_name} not found`);
    }

    return agent.name;
  },
});

const iPhoneDoneTool = createTool({
  name: "done",
  description: "Signal that the iPhone price search workflow is complete",
  parameters: z.object({
    reasoning: z.string().describe("The reasoning for completing the workflow"),
  }),
  handler: async ({ reasoning }) => {
    console.log("✅ [iPhone Supervisor] Workflow completed:", reasoning);
    return undefined;
  },
});

// iPhone Price Search Supervisor
const iphoneSupervisorAgent = createRoutingAgent({
  name: "iphone-supervisor",
  description:
    "AI supervisor that orchestrates the iPhone price search workflow",
  system: ({ network }) => {
    const state = network?.state.data;

    console.log("🔍 [iPhone Supervisor] Current state:", {
      rawResults: state?.rawSearchResults?.length || 0,
      extractedPrices: state?.extractedPrices?.length || 0,
      hasAnalysis: !!state?.priceAnalysis,
      completed: state?.completed || false,
    });

    const agents = Array.from(network?.agents.values() || []);

    return `You are an intelligent supervisor managing an iPhone price search workflow.

**IMPORTANT: YOU MUST CALL EITHER route_to_agent OR done. DO NOT JUST RESPOND WITH TEXT.**

**Current State:**
- Raw search results: ${state?.rawSearchResults?.length || 0}
- Extracted prices: ${state?.extractedPrices?.length || 0}
- Analysis complete: ${state?.priceAnalysis ? "Yes" : "No"}
- Workflow completed: ${state?.completed ? "Yes" : "No"}

**Available Agents:**
${agents.map((a) => `- ${a.name}: ${a.description}`).join("\n")}

**Your Job:**
1. Analyze the current state
2. Decide which agent should run next
3. Use route_to_agent tool to select the next agent
4. Use done tool when all steps are complete

**Workflow Logic:**
- If no raw search results: route to "iphone-scout"
- If raw results but no extracted prices: route to "price-extractor"
- If extracted prices but no analysis: route to "price-analyzer"
- If analysis is complete: call done

Think step by step and then CALL the appropriate tool.
`;
  },
  model: openai({ model: "gpt-4o-mini" }),
  tools: [routeToIPhoneAgentTool, iPhoneDoneTool],
  tool_choice: "auto",
  lifecycle: {
    onRoute: ({ result }) => {
      const toolCalls = (result as any).toolCalls;
      if (!toolCalls || toolCalls.length === 0) {
        return undefined;
      }

      const toolCall = toolCalls[0];
      const toolName = toolCall.tool?.name || toolCall.name;

      if (toolName === "done") {
        return undefined;
      }

      if (toolName === "route_to_agent") {
        // Only transition to the next agent once we have the tool result (content)
        const agentName =
          (toolCall.content as any)?.data || (toolCall.content as string);

        if (agentName) {
          console.log("🚀 [iPhone Supervisor] Routing to agent:", agentName);
          return [agentName];
        }
      }

      return undefined;
    },
  },
});

// iPhone Price Search Network
export const iphonePriceNetwork = createNetwork({
  name: "iphone_price_search_workflow",
  description:
    "Multi-agent system for finding the cheapest iPhone prices online",
  agents: [iphoneScoutAgent, priceExtractorAgent, priceAnalyzerAgent],
  router: iphoneSupervisorAgent,
  maxIter: 15,
  history: {
    get: async ({ state }) => {
      const runId = state.data.runId;
      if (!runId) return [];

      const { getDB } = await import("./db");
      const db = await getDB();
      const doc = await db.collection("iphone_results").findOne({ runId });

      if (doc?.results) {
        console.log(
          `📜 [History] Loaded ${doc.results.length} past results for runId: ${runId}`,
        );
        return doc.results;
      }
      return [];
    },
    appendResults: async ({ state, newResults }) => {
      const runId = state.data.runId;
      if (!runId || newResults.length === 0) return;

      const { getDB } = await import("./db");
      const db = await getDB();

      await db.collection("iphone_results").updateOne(
        { runId },
        {
          $push: { results: { $each: newResults } as any },
          $set: {
            state: state.data, // Persist the data state (vitals like rawSearchResults)
            updatedAt: new Date(),
          },
        },
      );
      console.log(
        `💾 [History] Saved ${newResults.length} new results and state for runId: ${runId}`,
      );
    },
  },
});
