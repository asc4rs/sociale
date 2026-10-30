"use client";

import { useEffect } from "react";
import { marquerConversationLue } from "@/app/actions/messages";

// Quand la conversation s'ouvre, elle est marquée comme lue.
export function MarquerConversationLue({ conversationId }: { conversationId: string }) {
  useEffect(() => {
    marquerConversationLue(conversationId).then(() => {
      window.dispatchEvent(new Event("messages-lus"));
    });
  }, [conversationId]);

  return null;
}