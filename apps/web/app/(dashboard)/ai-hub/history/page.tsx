'use client';

import { useAiHubConversations } from '@/hooks/api/use-ai-hub';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bot, MessageSquare, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function AiHubHistoryPage() {
  const { data: conversations, isLoading } = useAiHubConversations();

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <MessageSquare className="text-indigo-500" />
          Historial de Conversaciones
        </h2>
        <p className="text-sm text-slate-500 mt-1">Revisa tus interacciones anteriores con el asistente IA.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-indigo-500">
          <Loader2 className="animate-spin w-8 h-8 mb-4" />
          <p>Cargando historial...</p>
        </div>
      ) : !conversations || conversations.length === 0 ? (
        <div className="text-center py-20 text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <Bot className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p>Aún no hay conversaciones registradas.</p>
          <Link href="/ai-hub" className="text-indigo-500 hover:underline mt-2 inline-block">Iniciar un nuevo chat</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {conversations.map((conv: any) => (
            <Link key={conv.id} href={`/ai-hub?id=${conv.id}`}>
              <Card className="hover:shadow-md transition-all hover:border-indigo-200 dark:hover:border-indigo-800 cursor-pointer group bg-white dark:bg-slate-950">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Bot size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">
                        Conversación #{conv.id.substring(0, 8)}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {format(new Date(conv.updatedAt || conv.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}
                        </span>
                        {conv._count?.messages !== undefined && (
                          <span className="flex items-center gap-1">
                            <MessageSquare size={14} />
                            {conv._count.messages} mensajes
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <ChevronRight size={18} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
