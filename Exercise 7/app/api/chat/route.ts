import { openai } from "@ai-sdk/openai";
import {
  streamText,
  UIMessage,
  convertToModelMessages,
  createIdGenerator,
  validateUIMessages,
} from "ai";
import { getDocument, connectDB } from "@/lib/mongodb";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { searchSimilarVectors } from "@/lib/pinecone";
import { rerankWithCohere } from "@/lib/ai/rerank";
import { Document, DocumentSource } from "@/lib/types";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Following AI SDK best practices: expect either full messages or single message
    const body = await req.json();
    const { messages, message: singleMessage, selectedDocumentId } = body;

    if (!selectedDocumentId) {
      return new Response("Document ID is required", { status: 400 });
    }

    let allMessages: UIMessage[];
    let messageText: string;

    if (singleMessage) {
      // Following AI SDK best practices: single message approach
      allMessages = [singleMessage];
      messageText =
        singleMessage.parts?.find(
          (part: { type: string; text?: string }) => part.type === "text",
        )?.text ||
        singleMessage.content ||
        "";
    } else if (messages && messages.length > 0) {
      // Fallback: use all messages (less efficient)
      allMessages = messages;
      const latestMessage = messages[messages.length - 1];
      messageText =
        latestMessage.parts?.find(
          (part: { type: string; text?: string }) => part.type === "text",
        )?.text ||
        latestMessage.content ||
        "";
    } else {
      return new Response("No messages provided", { status: 400 });
    }

    // Validate messages following AI SDK best practices
    let validatedMessages: UIMessage[];
    try {
      validatedMessages = await validateUIMessages({
        messages: allMessages,
        // Add tools, metadataSchema, dataPartsSchema here if needed
      });
    } catch (error) {
      console.error("Message validation failed:", error);
      // For now, use messages as-is, but log the error
      validatedMessages = allMessages;
    }

    // Get context from selected document
    let context = "";
    if (selectedDocumentId && messageText) {
      try {
        // Get document info
        const document = await getDocument(selectedDocumentId);

        if (document) {
          // Generate embedding for single query
          const queryEmbedding = await generateEmbedding(messageText);

          const searchResults = await searchSimilarVectors(
            queryEmbedding,
            20, // Initial search results before reranking
            { documentId: { $eq: selectedDocumentId } },
          );

          console.log("\n=== PINECONE SEARCH RESULTS ===");
          console.log("Query:", messageText);
          console.log("Total results:", searchResults.length);
          console.log("Top 5 Pinecone results:");
          searchResults.slice(0, 5).forEach((result, index) => {
            console.log(
              `${index + 1}. Similarity: ${result.similarity.toFixed(4)} | Content: ${result.content?.substring(0, 100)}...`,
            );
          });

          // Apply Cohere reranking
          const rerankedResults = await rerankWithCohere(
            messageText,
            searchResults,
          );

          console.log("\n=== COHERE RERANKED RESULTS ===");
          console.log("Total reranked results:", rerankedResults.length);
          console.log("Top 5 Cohere results:");
          (rerankedResults as DocumentSource[])
            .slice(0, 5)
            .forEach((result, index) => {
              console.log(
                `${index + 1}. Relevance: ${result.similarity.toFixed(4)} | Content: ${result.content?.substring(0, 100)}...`,
              );
            });
          console.log("=== END COMPARISON ===\n");

          // Prepare context using reranked results
          const contextChunks = (rerankedResults as DocumentSource[])
            .slice(0, 10)
            .map(
              (result, index) =>
                `[Source ${index + 1}]: ${result.content || "No content available"}`,
            )
            .join("\n\n");

          context = `You have access to content from: ${(document as unknown as Document).title}\n\nContext:\n${contextChunks}`;
        }
      } catch (error) {
        console.error("RAG processing error:", error);
      }
    }

    // Stream the AI response with proper persistence following AI SDK best practices
    const result = streamText({
      model: openai("gpt-5-mini-2025-08-07"),
      system: `You are a helpful AI assistant that answers questions based on document context.

${context || "No document context available."}

IMPORTANT INSTRUCTIONS:
- Extract specific facts, numbers, and details from the context above
- If the context contains the answer, provide the exact information
- Quote specific amounts, percentages, and figures when available
- If the context doesn't contain the requested information, clearly state this
- Always base your answers on the provided context, not general knowledge`,
      messages: convertToModelMessages(validatedMessages),
      temperature: 0.1,
    });

    // Use consumeStream to handle client disconnects (AI SDK best practice)
    result.consumeStream();

    console.log(
      "About to return stream response with validatedMessages:",
      validatedMessages.length,
    );
    console.log("Context:", context);

    return result.toUIMessageStreamResponse({
      originalMessages: validatedMessages,
      // Generate consistent server-side IDs for persistence
      generateMessageId: createIdGenerator({
        prefix: "msg",
        size: 16,
      }),
      onFinish: async ({ messages }) => {
        // Following AI SDK best practices: save all messages including the new assistant response
        console.log("onFinish called with messages:", messages.length);
        console.log("All messages:", JSON.stringify(messages, null, 2));
        console.log("Last message role:", messages[messages.length - 1]?.role);
        console.log(
          "Last message content:",
          messages[messages.length - 1]?.parts,
        );

        try {
          await connectDB();

          const conversationId = selectedDocumentId;

          // Save all messages from the conversation using Mongoose
          for (const message of messages) {
            // Extract text content from message parts
            const textContent =
              message.parts
                ?.filter(
                  (part: { type: string; text?: string }) =>
                    part.type === "text",
                )
                ?.map((part: { type: string; text?: string }) => part.text)
                ?.join("") || "";

            // Use Mongoose Message model
            const { Message } = await import("@/lib/mongodb");
            await Message.create({
              id: message.id,
              conversationId,
              role: message.role,
              content: textContent,
              createdAt: new Date(),
              documentId: selectedDocumentId,
              context:
                message.role === "assistant"
                  ? context.substring(0, 1000)
                  : undefined,
            });
          }

          console.log("Messages saved successfully in onFinish");
        } catch (error) {
          console.error("Error saving messages in onFinish:", error);
        }
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
