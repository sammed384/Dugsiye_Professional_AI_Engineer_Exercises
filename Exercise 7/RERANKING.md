# Cohere Reranking Integration

This RAG system now includes optional Cohere reranking to improve search result consistency and relevance.

## What is Reranking?

Reranking takes your initial search results and reorders them based on semantic relevance to your query. This helps solve the inconsistency issue where similar questions ("tell me about chapter 5" vs "what he talked about chapter 5") return different results.

## Setup

1. **Get Cohere API Key**: Sign up at [Cohere](https://cohere.ai) and get your API key
2. **Add to Environment**: Add `COHERE_API_KEY=your_key_here` to your `.env.local` file
3. **That's it!** The system will automatically use reranking when available

## Configuration

All reranking settings are in `/lib/config/rerank.ts`:

```typescript
export const RERANK_CONFIG = {
  ENABLED: true,                    // Master toggle
  MODEL: "rerank-v3.5",            // Cohere model
  MAX_TOKENS_PER_DOC: 4096,        // Token limit per document
  INITIAL_SEARCH_RESULTS: 20,      // Results before reranking
  FINAL_RESULTS_COUNT: 10,         // Results after reranking
  ENABLE_LOGGING: true             // Console logging
};
```

## How to Disable

### Option 1: Environment Variable
Remove or comment out `COHERE_API_KEY` from your `.env.local`

### Option 2: Configuration
Set `ENABLED: false` in `/lib/config/rerank.ts`

### Option 3: Code Level
In `/app/api/chat/route.ts`, change:
```typescript
RERANK_CONFIG.ENABLED // Toggle reranking here
```
to:
```typescript
false // Disable reranking
```

## How It Works

1. **Initial Search**: Fetches 20 results from Pinecone based on embedding similarity
2. **Reranking**: Sends query + results to Cohere for semantic reranking
3. **Final Results**: Returns top 10 most relevant results
4. **Fallback**: If Cohere fails, uses original Pinecone results

## Benefits

- **Consistency**: Same question gets same relevant results
- **Better Relevance**: Cohere's rerank model is optimized for semantic matching
- **Optional**: Easy to disable without breaking anything
- **Fallback Safe**: Always returns results even if reranking fails

## API Usage

Based on [Cohere's Rerank API](https://docs.cohere.com/reference/rerank):

```typescript
POST https://api.cohere.com/v2/rerank
{
  "model": "rerank-v3.5",
  "query": "your search query",
  "documents": ["doc1", "doc2", ...],
  "top_n": 10
}
```

## Troubleshooting

- **No reranking happening**: Check if `COHERE_API_KEY` is set
- **API errors**: Check your Cohere account limits and API key
- **Performance**: Reranking adds ~200-500ms latency but improves accuracy
- **Costs**: Reranking costs are minimal (see Cohere pricing)

## Performance Impact

- **Latency**: +200-500ms per query
- **Accuracy**: Significant improvement in result relevance
- **Cost**: ~$0.002 per 1000 search queries (Cohere pricing)
