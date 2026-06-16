"use client";

import { useState, useRef, useEffect } from "react";
import { Message, useSendMessage } from "@/hooks/api/use-whatsapp";
import { format } from "date-fns";
import { Send, Paperclip, Smile, Loader2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatWindowProps {
  chatId: string;
  messages: Message[];
  isLoading: boolean;
}

export function ChatWindow({ chatId, messages, isLoading }: ChatWindowProps) {
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { mutate: sendMessage, isPending } = useSendMessage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;
    sendMessage({ chatId, content: inputValue });
    setInputValue("");
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#EFEAE2] dark:bg-zinc-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#EFEAE2] dark:bg-zinc-900 relative">
      {/* Background pattern similar to WhatsApp */}
      <div className="absolute inset-0 opacity-[0.06] dark:opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://static.whatsapp.net/rsrc.php/v3/yl/r/r_QZ34PIwZ_.png")' }}></div>
      
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="flex flex-col gap-2 relative z-10">
          {messages.map((msg) => {
            const isUser = msg.sender === "USER";
            const isAI = msg.sender === "AI";
            
            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 shadow-sm relative ${
                    isUser
                      ? "bg-[#D9FDD3] dark:bg-[#005C4B] text-foreground rounded-tr-none"
                      : isAI
                      ? "bg-primary/20 dark:bg-primary/20 border border-primary/30 rounded-tl-none"
                      : "bg-white dark:bg-[#202C33] text-foreground rounded-tl-none"
                  }`}
                >
                  {isAI && (
                    <div className="flex items-center gap-1 text-xs text-primary mb-1 font-medium">
                      <Bot className="h-3 w-3" /> AI Assistant
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[10px] text-muted-foreground/80">
                      {format(new Date(msg.timestamp), "HH:mm")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-3 bg-[#F0F2F5] dark:bg-[#202C33] relative z-10 flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Smile className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Paperclip className="h-5 w-5" />
        </Button>
        <form onSubmit={handleSend} className="flex-1 flex">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message"
            className="flex-1 rounded-full bg-white dark:bg-[#2A3942] border-none focus-visible:ring-0 shadow-sm px-4 py-6"
          />
        </form>
        <Button 
          onClick={() => handleSend()} 
          size="icon" 
          className="rounded-full bg-primary text-primary-foreground shrink-0 h-10 w-10"
          disabled={!inputValue.trim() || isPending}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-1" />}
        </Button>
      </div>
    </div>
  );
}
