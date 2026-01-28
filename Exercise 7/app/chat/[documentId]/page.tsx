import { connectDB, getDocument, getMessages } from "@/lib/mongodb";
import { redirect } from "next/navigation";
import ChatInterface from "@/components/chat-interface-new";
import { UIMessage } from "ai";
import { Document } from "@/lib/types";

interface PageProps {
  params: Promise<{ documentId: string }>;
}

// Server-side function to load chat history
async function loadChatHistory(documentId: string): Promise<UIMessage[]> {
  try {
    await connectDB();

    // Get chat history for the document (conversation) using Mongoose
    const messages = await getMessages(documentId);

    // Convert to AI SDK format
    return messages.map((msg: unknown) => {
      const m = msg as {
        id: string;
        role: string;
        content: string;
        createdAt: string | Date;
      };
      return {
        id: m.id,
        role: m.role as "user" | "assistant",
        parts: [{ type: "text" as const, text: m.content }],
        createdAt: new Date(m.createdAt),
      };
    });
  } catch (error) {
    console.error("Error loading chat history:", error);
    return [];
  }
}

export default async function ChatPage({ params }: PageProps) {
  const { documentId } = await params;

  console.log("Chat page - documentId:", documentId);

  // Validate document exists
  const document = await getDocument(documentId);
  console.log("Chat page - document found:", !!document);

  if (!document) {
    console.log("Chat page - document not found, redirecting to home");
    redirect("/");
  }

  // Load chat history server-side
  const initialMessages = await loadChatHistory(documentId);

  return (
    <ChatInterface
      selectedDocumentId={documentId}
      initialMessages={initialMessages}
      documentTitle={(document as unknown as Document).title}
    />
  );
}
