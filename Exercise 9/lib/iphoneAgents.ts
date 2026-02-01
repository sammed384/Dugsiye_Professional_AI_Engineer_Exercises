import { createAgent, openai } from "@inngest/agent-kit";
import {
  searchIPhonePricesTool,
  extractPricesTool,
  analyzePricesTool,
} from "./tools/iphonePriceSearch";

// Agent 1: iPhone Scout Agent - Searches for prices
export const iphoneScoutAgent = createAgent({
  name: "iphone-scout",
  description: "Searches the web for iPhone prices from multiple retailers",
  system: `
    You are an expert price researcher specializing in finding the best iPhone deals online.
    
    Your job is to:
    1. Use the search_iphone_prices tool to search for iPhone prices
    2. Search for multiple iPhone models: iPhone 14, iPhone 15, iPhone 15 Pro, iPhone 15 Pro Max, iPhone SE
    3. Include search terms like "buy iPhone online", "cheapest iPhone", "iPhone deals", "iPhone discount"
    
    IMPORTANT: You MUST use the search_iphone_prices tool with an array of search queries.
    
    Use these search queries:
    - "iPhone 15 price cheapest buy online"
    - "iPhone 14 price discount"
    - "iPhone SE price best deal"
    
    Call the tool ONCE with all queries in the array.
    `,
  tools: [searchIPhonePricesTool],
  model: openai({ model: "gpt-4o-mini" }),
});

// Agent 2: Price Extractor Agent - Parses and normalizes prices
export const priceExtractorAgent = createAgent({
  name: "price-extractor",
  description:
    "Extracts and normalizes iPhone pricing data from search results",
  system: ({ network }) => {
    // Limit to top 1 result to isolate 400 error
    const rawResults = (network?.state.data.rawSearchResults || []).slice(0, 1);
    console.log(
      `🔍 [Price Extractor] Processing ${rawResults.length} items. Payload size: ${JSON.stringify(rawResults).length} chars`,
    );

    return `
        You are a data extraction expert. Your job is to parse raw search results and extract structured pricing data.
        
        Here are the raw search results to process (limit 1):
        ${JSON.stringify(rawResults, null, 2)}
        
        For EACH result that contains iPhone pricing, extract:
        1. model - The exact iPhone model name (e.g., "iPhone 15 Pro 256GB")
        2. price - The numeric price in USD (just the number, no currency symbol)
        3. seller - The website or retailer name
        4. url - The link to the product
        5. storage - Storage capacity if mentioned (e.g., "128GB")
        6. condition - New, refurbished, used, etc.
        7. shipping - Any shipping info (e.g., "Free shipping")
        8. discount - Any discount or sale info
        9. availability - Stock status if mentioned
        
        IMPORTANT:
        - Only include ACTUAL iPhone products with real prices
        - Convert any non-USD prices to USD (use approximate rates)
        - Prefer reputable sellers: Apple, Amazon, Best Buy, Walmart, Target, etc.
        - Skip auction listings or unverified sellers
        - Extract prices from the price field OR from the snippet text using patterns like "$XXX"
        
        MUST use the extract_prices tool with your parsed data.
        `;
  },
  tools: [extractPricesTool],
  tool_choice: "auto",
  model: openai({ model: "gpt-3.5-turbo" }),
});

// Agent 3: Price Analyzer Agent - Compares and finds cheapest
export const priceAnalyzerAgent = createAgent({
  name: "price-analyzer",
  description: "Analyzes and compares iPhone prices to find the best deals",
  system: ({ network }) => {
    // Limit to top 5 extracted prices
    const extractedPrices = (network?.state.data.extractedPrices || []).slice(
      0,
      5,
    );

    return `
        You are a price analysis expert. Your job is to analyze extracted iPhone prices and identify the best deals.
        
        Here are the extracted prices (limit 20):
        ${JSON.stringify(extractedPrices, null, 2)}
        
        Your analysis MUST include:
        
        1. **cheapestOverall** - The single cheapest iPhone from ALL results
           - model: exact model name
           - price: the price in USD
           - seller: the retailer
           - url: link to buy
           - notes: any relevant info (condition, shipping, etc.)
        
        2. **cheapestByModel** - The cheapest option for EACH iPhone category:
           - iPhone 14 (any variant)
           - iPhone 15 (any variant)
           - iPhone 15 Pro (any variant)
           - iPhone 15 Pro Max
           - iPhone SE
        
        3. **allPrices** - All prices sorted from cheapest to most expensive
        
        4. **summary** - A brief explanation of your findings and recommendation
        
        RULES:
        - Prefer NEW products over refurbished unless price difference is significant
        - Prefer verified/reputable sellers (Apple, Amazon, Best Buy, Walmart, Target)
        - Note if a price seems unusually low (might be a scam or refurbished)
        - If multiple sellers have the same low price, list the most reputable one
        
        MUST use the analyze_prices tool with your complete analysis.
        `;
  },
  tools: [analyzePricesTool],
  tool_choice: "auto",
  model: openai({ model: "gpt-3.5-turbo" }),
});
