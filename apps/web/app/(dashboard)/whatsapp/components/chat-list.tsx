"use client";

import { Chat } from "@/hooks/api/use-whatsapp";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ChatListProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

export function ChatList({ chats, activeChatId, onSelectChat }: ChatListProps) {
  return (
    <div className="w-80 border-r flex flex-col bg-muted/10 h-full">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search chats..."
            className="pl-8 bg-background"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors text-left border-b border-border/50 ${
                activeChatId === chat.id ? "bg-muted" : ""
              }`}
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {chat.contactName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate">{chat.contactName}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    {format(new Date(chat.updatedAt), "HH:mm")}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground">
                    {chat.funnelStage || "NUEVO"}
                  </span>
                  <p className="text-sm text-muted-foreground truncate flex-1">
                    {chat.lastMessage}
                  </p>
                </div>
              </div>
              {chat.unreadCount > 0 && (
                <div className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-1">
                  {chat.unreadCount}
                </div>
              )}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
