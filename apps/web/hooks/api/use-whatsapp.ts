import { useEffect, useRef } from "react";
import {  useQuery, useMutation, useQueryClient  } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { io, Socket } from "socket.io-client";
import { create } from "zustand";

export interface WhatsAppSession {
  id: string;
  name: string;
  status: "CONNECTED" | "DISCONNECTED" | "QR_READY";
  qrCode?: string;
  phoneNumber?: string;
}

export interface Chat {
  id: string;
  sessionId: string;
  contactName: string;
  contactPhone: string;
  lastMessage: string;
  unreadCount: number;
  funnelStage: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  content: string;
  sender: "USER" | "CONTACT" | "AI";
  timestamp: string;
  status: "SENT" | "DELIVERED" | "READ";
}

export interface AIAnalysis {
  summary: string;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  suggestedReplies: string[];
}

interface SocketStore {
  socket: Socket | null;
  connect: () => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  connect: () => {
    if (!get().socket) {
      const socketUrl = process.env.NEXT_PUBLIC_WS_URL || (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '') : "");
      const socket = io(socketUrl, {
        path: "/api/socket/io",
        addTrailingSlash: false,
      });
      set({ socket });
    }
  },
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));

export const useWhatsAppSessions = () => {
  return useQuery({
    queryKey: ["whatsapp", "sessions"],
    queryFn: async (): Promise<WhatsAppSession[]> => {
      const res = await api.get("/whatsapp/sessions");
      return res.data?.data || [];
    },
  });
};

export const useChats = () => {
  return useQuery({
    queryKey: ["whatsapp", "chats"],
    queryFn: async (): Promise<Chat[]> => {
      try {
        const res = await api.get("/whatsapp/conversations");
        const data = res.data?.data || res.data || [];
        console.log("Fetched chats data:", data);
        return data.map((conv: any) => ({
          id: conv.id,
          sessionId: conv.sessionId,
          contactName: conv.name || conv.phoneNumber || 'Desconocido',
          contactPhone: conv.phoneNumber || '',
          lastMessage: conv.lastMessageText || '',
          unreadCount: conv.unreadCount || 0,
          funnelStage: conv.funnelStage || 'NUEVO',
          updatedAt: conv.updatedAt,
        }));
      } catch (error) {
        console.error("Error fetching chats:", error);
        throw error;
      }
    },
    refetchInterval: 5000, // Refetch every 5s to catch new history syncs
  });
};

export const useUpdateConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Chat> }) => {
      const res = await api.patch(`/whatsapp/conversations/${id}`, data);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "chats"] });
    },
  });
};

export const useMessages = (chatId: string | null) => {
  const queryClient = useQueryClient();
  const socket = useSocketStore((state) => state.socket);

  useEffect(() => {
    if (!socket || !chatId) return;

    const onNewMessage = (newMessage: Message) => {
      if (newMessage.chatId === chatId) {
        queryClient.setQueryData<Message[]>(["whatsapp", "messages", chatId], (old = []) => {
          return [...old, newMessage];
        });
      }
    };

    socket.on("whatsapp:message", onNewMessage);
    return () => {
      socket.off("whatsapp:message", onNewMessage);
    };
  }, [socket, chatId, queryClient]);

  return useQuery({
    queryKey: ["whatsapp", "messages", chatId],
    queryFn: async (): Promise<Message[]> => {
      if (!chatId) return [];
      const res = await api.get(`/whatsapp/conversations/${chatId}/messages`);
      const data = res.data?.data || res.data || [];
      return data.map((msg: any) => ({
        id: msg.id,
        chatId: msg.conversationId,
        content: msg.body || '',
        sender: msg.direction === 'OUTBOUND' ? 'USER' : 'CONTACT',
        timestamp: msg.createdAt,
        status: msg.status,
      }));
    },
    enabled: !!chatId,
    refetchInterval: 5000,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ chatId, content }: { chatId: string; content: string }): Promise<Message> => {
      const res = await api.post(`/whatsapp/conversations/${chatId}/messages`, {
        body: content,
        type: 'TEXT',
        to: 'unknown' // Backend handles formatting to JID from conversation
      });
      const msg = res.data?.data || res.data;
      return {
        id: msg.id,
        chatId: msg.conversationId,
        content: msg.body || '',
        sender: msg.direction === 'OUTBOUND' ? 'USER' : 'CONTACT',
        timestamp: msg.createdAt,
        status: msg.status,
      };
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData<Message[]>(["whatsapp", "messages", newMessage.chatId], (old = []) => {
        return [...old, newMessage];
      });
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "chats"] });
    },
  });
};

export const useChatAnalysis = (chatId: string | null) => {
  return useQuery({
    queryKey: ["whatsapp", "analysis", chatId],
    queryFn: async (): Promise<AIAnalysis> => {
      if (!chatId) return { summary: "", sentiment: "NEUTRAL", suggestedReplies: [] };
      const res = await fetch(`/api/whatsapp/chats/${chatId}/analysis`);
      if (!res.ok) throw new Error("Failed to fetch AI analysis");
      return res.json();
    },
    enabled: !!chatId,
  });
};

export interface CopilotData {
  conversationId: string;
  contactName: string | null;
  phone: string | null;
  funnelStage: string;
  aiSummary: string | null;
  sentimentScore: number | null;
  sentiment: string | null;
  priority: string | null;
  clientData: Record<string, string>;
  missingData: string[];
  suggestedActions: string[];
  lastAnalyzedAt: string | null;
}

export const useCopilot = (chatId: string | null) => {
  return useQuery({
    queryKey: ["whatsapp", "copilot", chatId],
    queryFn: async (): Promise<CopilotData> => {
      const res = await api.get(`/whatsapp/conversations/${chatId}/copilot`);
      return res.data?.data || res.data;
    },
    enabled: !!chatId,
    refetchInterval: 10000, // Refresh copilot every 10s
  });
};

export interface ClientProfileData {
  linked: boolean;
  conversationId: string;
  contactName: string;
  phone: string;
  funnelStage: string;
  extractedData: Record<string, string>;
  client: any | null;
  leads: any[];
  conversations: any[];
  credits: any[];
}

export const useClientProfile = (chatId: string | null) => {
  return useQuery({
    queryKey: ["whatsapp", "client-profile", chatId],
    queryFn: async (): Promise<ClientProfileData> => {
      const res = await api.get(`/whatsapp/conversations/${chatId}/client-profile`);
      return res.data?.data || res.data;
    },
    enabled: !!chatId,
  });
};
