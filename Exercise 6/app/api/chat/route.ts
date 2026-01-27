import { openai } from "@ai-sdk/openai";
import {
  streamText,
  UIMessage,
  convertToModelMessages,
  createIdGenerator,
  validateUIMessages,
  tool,
} from "ai";
import { auth } from "@/lib/auth";
import { loadChat, saveChat, getConversation } from "@/lib/chat-store";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Get the authenticated session
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Following AI SDK best practices: expect either full messages or single message
    const body = await req.json();
    const { messages, message: singleMessage, id: conversationId } = body;

    if (!conversationId) {
      return new Response("Conversation ID is required", { status: 400 });
    }

    // Validate conversation ownership
    const conversation = await getConversation(conversationId, session.user.id);
    if (!conversation) {
      return new Response("Conversation not found", { status: 404 });
    }

    let allMessages: UIMessage[];

    if (singleMessage) {
      // Following Vercel guide: load previous messages and append new one
      const previousMessages = await loadChat(conversationId);
      allMessages = [...previousMessages, singleMessage];
    } else if (messages) {
      // Fallback: use all messages (less efficient)
      allMessages = messages;
    } else {
      return new Response("No messages provided", { status: 400 });
    }

    // Validate messages following Vercel guide
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

    // Stream the AI response with proper persistence following Vercel guide
    const result = streamText({
      model: openai("gpt-4o"),
      system:
        "You are a helpful AI assistant. Be concise and helpful in your responses. You can generate images using the generateImage tool when requested.",
      messages: convertToModelMessages(validatedMessages),
      tools: {
        generateImage: tool({
          description: "Generate an image based on a prompt",
          inputSchema: z.object({
            prompt: z
              .string()
              .describe("The prompt to generate the image from"),
          }),
          execute: async ({ prompt }) => {
            const response = await fetch(
              "https://api.openai.com/v1/images/generations",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                  model: "dall-e-3",
                  prompt,
                  n: 1,
                  size: "1024x1024",
                }),
              },
            );

            const data = await response.json();
            if (data.error) {
              throw new Error(data.error.message);
            }

            return { url: data.data[0].url };
          },
        }),
      },
    });

    // Use consumeStream to handle client disconnects (Vercel guide recommendation)
    // Note: consumeStream() is called without await to not block the response
    result.consumeStream();

    console.log(
      "About to return stream response with originalMessages:",
      validatedMessages.length,
    );

    return result.toUIMessageStreamResponse({
      originalMessages: validatedMessages,
      // Generate consistent server-side IDs for persistence
      generateMessageId: createIdGenerator({
        prefix: "msg",
        size: 16,
      }),
      onFinish: async ({ messages }) => {
        // Following Vercel guide: save all messages including the new assistant response
        console.log("onFinish called with messages:", messages.length);
        console.log("All messages:", JSON.stringify(messages, null, 2));
        console.log("Last message role:", messages[messages.length - 1]?.role);
        console.log(
          "Last message content:",
          messages[messages.length - 1]?.parts,
        );
        try {
          await saveChat({ chatId: conversationId, messages });
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
