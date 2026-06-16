"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCopilot, useMessages, useSendMessage, useClientProfile, useUpdateConversation } from "@/hooks/api/use-whatsapp";
import { Send, Bot, User, MessageCircle, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ChatPanelProps {
  chatId: string | null;
  onClose: () => void;
  contactName: string;
}

export function ChatPanel({ chatId, onClose, contactName }: ChatPanelProps) {
  const { data: copilot, isLoading: isLoadingCopilot } = useCopilot(chatId);
  const { data: messages, isLoading: isLoadingMessages } = useMessages(chatId);
  const { data: clientProfile, isLoading: isLoadingProfile } = useClientProfile(chatId);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { mutate: updateConversation } = useUpdateConversation();
  
  const [messageInput, setMessageInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!messageInput.trim() || !chatId) return;
    sendMessage({ chatId, content: messageInput });
    setMessageInput("");
  };

  const handleStageChange = (newStage: string) => {
    if (chatId) {
      updateConversation({ id: chatId, data: { funnelStage: newStage } });
    }
  };

  return (
    <Dialog open={!!chatId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 border-b bg-muted/20">
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            {contactName}
          </DialogTitle>
          <DialogDescription>
            ID de Conversación: {chatId?.split("-")[0]}...
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="chat" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-2 border-b">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="copilot" className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                Copilot IA
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Chat en Vivo
              </TabsTrigger>
              <TabsTrigger value="crm" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Perfil CRM
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden relative">
            {/* COPILOT TAB */}
            <TabsContent value="copilot" className="m-0 h-full overflow-y-auto p-4 space-y-6">
              {isLoadingCopilot ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">Cargando insights...</div>
              ) : copilot ? (
                <>
                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                    <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      Resumen de la Conversación
                    </h3>
                    <p className="text-sm">{copilot.aiSummary || "Aún no hay suficiente contexto."}</p>
                  </div>

                  {copilot.suggestedActions?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Acciones Sugeridas
                      </h4>
                      <ul className="space-y-2">
                        {copilot.suggestedActions.map((action, i) => (
                          <li key={i} className="text-sm flex items-start gap-2 bg-muted/30 p-2 rounded-md">
                            <ChevronRight className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {copilot.missingData?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        Información Faltante
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {copilot.missingData.map((data, i) => (
                          <span key={i} className="text-xs bg-orange-500/10 text-orange-600 px-2 py-1 rounded-md border border-orange-500/20">
                            {data}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-muted-foreground mt-10">No hay datos del copiloto disponibles.</div>
              )}
            </TabsContent>

            {/* CHAT TAB */}
            <TabsContent value="chat" className="m-0 h-full flex flex-col">
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">Cargando mensajes...</div>
                ) : (
                  <div className="space-y-4 pb-4">
                    {messages?.map((msg) => (
                      <div key={msg.id} className={`flex flex-col ${msg.sender === "USER" ? "items-end" : "items-start"}`}>
                        <div 
                          className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                            msg.sender === "USER" 
                              ? "bg-primary text-primary-foreground rounded-tr-sm" 
                              : "bg-muted rounded-tl-sm"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1 px-1">
                          {format(new Date(msg.timestamp), "HH:mm", { locale: es })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <div className="p-3 bg-background border-t">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex items-center gap-2"
                >
                  <Input 
                    placeholder="Escribe un mensaje..." 
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    disabled={isSending}
                    className="rounded-full bg-muted/50"
                  />
                  <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={isSending || !messageInput.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </TabsContent>

            {/* CRM TAB */}
            <TabsContent value="crm" className="m-0 h-full overflow-y-auto p-4 space-y-6">
              {isLoadingProfile ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">Cargando perfil CRM...</div>
              ) : clientProfile ? (
                <>
                  <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/10">
                    <div>
                      <h3 className="font-semibold">{clientProfile.linked ? 'Cliente Vinculado en CRM' : 'Prospecto No Vinculado'}</h3>
                      <p className="text-sm text-muted-foreground">{clientProfile.linked ? 'Los datos de esta persona ya están en tu base de clientes.' : 'La IA ha extraído datos pero aún no es cliente activo.'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${clientProfile.linked ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'}`}>
                      {clientProfile.linked ? 'Activo' : 'Pendiente'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-3">Etapa del Embudo</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {["NUEVO", "INTERESADO", "NEGOCIANDO", "CLIENTE", "SOPORTE", "DESCARTADO"].map(stage => (
                        <Button 
                          key={stage} 
                          variant={clientProfile.funnelStage === stage ? "default" : "outline"}
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => handleStageChange(stage)}
                        >
                          {stage}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {Object.keys(clientProfile.extractedData || {}).length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-3">Datos Extraídos por IA</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(clientProfile.extractedData).map(([key, value]) => (
                          <div key={key} className="bg-muted/30 p-2 rounded-md border">
                            <span className="text-[10px] uppercase text-muted-foreground font-semibold block mb-0.5">{key.replace(/_/g, ' ')}</span>
                            <span className="text-sm font-medium">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-muted-foreground mt-10">No se pudo cargar el perfil CRM.</div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
