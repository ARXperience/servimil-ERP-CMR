"use client";

import { useState, useMemo } from "react";
import { useChats, useUpdateConversation } from "@/hooks/api/use-whatsapp";
import { Loader2, MessageCircle, Clock, Search, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ChatPanel } from "./components/chat-panel";

const FUNNEL_STAGES = [
  { id: "NUEVO", label: "Nuevo", color: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400" },
  { id: "INTERESADO", label: "Interesado", color: "bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400" },
  { id: "NEGOCIANDO", label: "Negociando", color: "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400" },
  { id: "CLIENTE", label: "Cliente", color: "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400" },
  { id: "SOPORTE", label: "Soporte", color: "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400" },
  { id: "DESCARTADO", label: "Descartado", color: "bg-gray-500/10 border-gray-500/20 text-gray-600 dark:text-gray-400" },
];

export default function WhatsAppPipelinePage() {
  const { data: chats, isLoading } = useChats();
  const { mutate: updateConversation } = useUpdateConversation();
  const [searchTerm, setSearchTerm] = useState("");

  // Chat Panel State
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedContactName, setSelectedContactName] = useState<string>("");

  // Handle Drag & Drop
  const [draggedChatId, setDraggedChatId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, chatId: string) => {
    setDraggedChatId(chatId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    if (draggedChatId) {
      updateConversation({ id: draggedChatId, data: { funnelStage: targetStage } });
      setDraggedChatId(null);
    }
  };

  const filteredChats = useMemo(() => {
    if (!chats) return [];
    return chats.filter(chat => 
      chat.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.contactPhone.includes(searchTerm)
    );
  }, [chats, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full bg-[#f8f9fa] dark:bg-zinc-950 p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Embudo CRM de WhatsApp</h2>
          <p className="text-muted-foreground">Clasificación automática por IA y gestión visual de clientes.</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar conversaciones..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {FUNNEL_STAGES.map((stage) => {
          const stageChats = filteredChats.filter(c => (c.funnelStage || "NUEVO") === stage.id);

          return (
            <div 
              key={stage.id} 
              className="flex flex-col min-w-[320px] max-w-[320px] bg-white dark:bg-zinc-900 rounded-xl border shadow-sm"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Column Header */}
              <div className={`p-3 border-b flex items-center justify-between rounded-t-xl ${stage.color}`}>
                <h3 className="font-semibold text-sm tracking-wide">{stage.label}</h3>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20">
                  {stageChats.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {stageChats.map((chat) => (
                  <div
                    key={chat.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, chat.id)}
                    onClick={() => {
                      setSelectedChatId(chat.id);
                      setSelectedContactName(chat.contactName);
                    }}
                    className="group bg-background border rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer cursor-grab active:cursor-grabbing border-l-4 border-l-transparent hover:border-l-primary"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <GripVertical className="w-4 h-4 mr-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        <h4 className="font-medium text-sm line-clamp-1">{chat.contactName}</h4>
                      </div>
                      {chat.unreadCount > 0 && (
                        <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {chat.lastMessage || "Sin mensajes recientes..."}
                    </p>
                    
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t pt-2">
                      <span className="flex items-center">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        {chat.contactPhone}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {chat.updatedAt ? formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true, locale: es }) : ''}
                      </span>
                    </div>
                  </div>
                ))}
                
                {stageChats.length === 0 && (
                  <div className="text-center p-6 border-2 border-dashed rounded-lg border-muted/50 text-muted-foreground text-sm">
                    Suelta los chats aquí
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ChatPanel 
        chatId={selectedChatId} 
        contactName={selectedContactName} 
        onClose={() => setSelectedChatId(null)} 
      />
    </div>
  );
}
