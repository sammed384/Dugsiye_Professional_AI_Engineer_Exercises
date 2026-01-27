"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, LayoutDashboard } from "lucide-react";
import { getConversations, startNewChat } from "@/app/chat/actions";
import Link from "next/link";

interface Conversation {
  id: string;
  title: string;
  updatedAt: Date | null;
}

export function Sidebar() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const currentId = params.id as string;

  useEffect(() => {
    async function fetchConversations() {
      try {
        const data = await getConversations();
        // Convert string dates to Date objects if necessary
        const formattedData = data.map((c) => ({
          ...c,
          updatedAt: c.updatedAt ? new Date(c.updatedAt) : null,
        }));
        setConversations(formattedData);
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchConversations();
  }, [currentId]);

  return (
    <div className="w-64 h-screen bg-gray-900 text-gray-100 flex flex-col border-r border-gray-800">
      <div className="p-4">
        <Button
          onClick={() => startNewChat()}
          className="w-full justify-start gap-2 bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {isLoading ? (
          <div className="p-4 text-gray-500 text-sm">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-gray-500 text-sm italic text-center">
            No conversations yet
          </div>
        ) : (
          conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/chat/${conv.id}`}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                currentId === conv.id
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              }`}
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="truncate">{conv.title}</span>
            </Link>
          ))
        )}
      </div>

      <div className="p-4 border-t border-gray-800 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-gray-400 hover:text-white hover:bg-gray-800"
          onClick={() => router.push("/dashboard")}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Button>
      </div>
    </div>
  );
}
