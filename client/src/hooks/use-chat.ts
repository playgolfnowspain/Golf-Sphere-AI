import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Message } from "@shared/models/chat";

// Helper type for what the UI expects
export interface ChatMessage {
  id: string; // Temporary ID for streaming or real ID from DB
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function useChat() {
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const queryClient = useQueryClient();

  // 1. Create a conversation if none exists
  const createConversation = useMutation({
    mutationFn: async (title: string = "New Golf Chat") => {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to create conversation");
      return res.json();
    },
    onSuccess: (data) => {
      setActiveConversationId(data.id);
    },
  });

  // 2. Fetch history when conversation ID changes
  useQuery({
    queryKey: ["conversation", activeConversationId],
    queryFn: async () => {
      if (!activeConversationId) return null;
      const res = await fetch(`/api/conversations/${activeConversationId}`);
      if (!res.ok) throw new Error("Failed to load chat");
      const data = await res.json();
      
      // Transform DB messages to UI messages
      const uiMessages: ChatMessage[] = (data.messages || []).map((m: any) => ({
        id: m.id.toString(),
        role: m.role,
        content: m.content,
      }));
      setMessages(uiMessages);
      return data;
    },
    enabled: !!activeConversationId,
  });

  // 3. Send message with streaming
  const sendMessage = async (content: string) => {
    let currentConversationId = activeConversationId;

    // If no conversation, create one first
    if (!currentConversationId) {
      try {
        const conv = await createConversation.mutateAsync("Golf Assistant");
        currentConversationId = conv.id;
        setActiveConversationId(conv.id);
      } catch (err) {
        console.error("Failed to init chat", err);
        return;
      }
    }

    if (!currentConversationId) return;

    // Optimistically add user message
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, role: "user", content }]);
    setIsTyping(true);

    try {
      const response = await fetch(`/api/conversations/${currentConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error("Network response was not ok");
      if (!response.body) throw new Error("No response body");

      // Set up placeholder for assistant response
      const assistantMsgId = (Date.now() + 1).toString();
      setMessages(prev => [
        ...prev, 
        { id: assistantMsgId, role: "assistant", content: "", isStreaming: true }
      ]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done) {
                // Done streaming
                setMessages(prev => prev.map(m => 
                  m.id === assistantMsgId ? { ...m, isStreaming: false } : m
                ));
              } else if (data.content) {
                assistantContent += data.content;
                setMessages(prev => prev.map(m => 
                  m.id === assistantMsgId ? { ...m, content: assistantContent } : m
                ));
              }
            } catch (e) {
              console.error("Error parsing SSE chunk", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: "Sorry, I had trouble connecting to the golf club. Please try again." }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return {
    messages,
    sendMessage,
    isTyping,
    reset: () => {
      setActiveConversationId(null);
      setMessages([]);
    }
  };
}
