/**
 * Reranking Configuration
 * Easy toggle for Cohere reranking functionality
 */

export const RERANK_CONFIG = {
  // Set to false to completely disable reranking
  ENABLED: true,
  
  // Cohere model to use for reranking
  MODEL: "rerank-v3.5" as const,
  
  // Maximum tokens per document for reranking
  MAX_TOKENS_PER_DOC: 4096,
  
  // Number of initial search results to fetch (before reranking)
  INITIAL_SEARCH_RESULTS: 20,
  
  // Number of final results to return after reranking
  FINAL_RESULTS_COUNT: 10,
  
  // Whether to log reranking performance
  ENABLE_LOGGING: true
} as const;

/**
 * Check if reranking is available and enabled
 */
export function isRerankingEnabled(): boolean {
  return RERANK_CONFIG.ENABLED && !!process.env.COHERE_API_KEY;
}
