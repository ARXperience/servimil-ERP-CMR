"use client";

import { useState, useEffect } from "react";
import { useChats, useMessages, useSocketStore } from "@/hooks/api/use-whatsapp";
import { ChatList } from "./components/chat-list";
import { ChatWindow } from "./components/chat-window";
import { AISidebar } from "./components/ai-sidebar";
import { Loader2 } from "lucide-react";

export default function WhatsAppPage() {
  const { data: chats, isLoading: chatsLoading } = useChats();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  
  const { data: messages, isLoading: messagesLoading } = useMessages(activeChatId);
  const connectSocket = useSocketStore((state) => state.connect);

  useEffect(() => {
    connectSocket();
  }, [connectSocket]);

  if (chatsLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSelectSuggestion = (text: string) => {
    // We would need to pass this down to ChatWindow or handle it via a ref/state
    // For now, it's a placeholder functionality
    console.log("Selected suggestion:", text);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden">
      <ChatList 
        chats={chats || []} 
        activeChatId={activeChatId} 
        onSelectChat={setActiveChatId} 
      />
      
      {activeChatId ? (
        <ChatWindow 
          chatId={activeChatId} 
          messages={messages || []} 
          isLoading={messagesLoading} 
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#EFEAE2] dark:bg-zinc-900 border-r border-border/50">
          <div className="max-w-md text-center space-y-4">
            <h2 className="text-3xl font-light text-foreground/80">SERVIMIL Web</h2>
            <p className="text-muted-foreground">Selecciona un chat para comenzar. Las respuestas automáticas de IA están activadas en la configuración.</p>
            <div className="pt-6">
              <a href="/whatsapp/sessions">
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                  Conectar Dispositivo con QR
                </button>
              </a>
            </div>
          </div>
        </div>
      )}

      <AISidebar 
        chatId={activeChatId} 
        onSelectSuggestion={handleSelectSuggestion} 
      />
    </div>
  );
}
