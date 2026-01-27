"use server";

import { auth } from "@/lib/auth";
import { getUserConversations, createConversation } from "@/lib/chat-store";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function getConversations() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return [];
  }

  return await getUserConversations(session.user.id);
}

export async function startNewChat() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const conversationId = await createConversation(session.user.id);
  redirect(`/chat/${conversationId}`);
}
