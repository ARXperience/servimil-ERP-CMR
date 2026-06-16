'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useAiHubChat, useAiHubConversation, useAiHubConfirmAction } from '@/hooks/api/use-ai-hub';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, ShieldAlert, Check, X, Loader2, Mic, Square, Volume2, VolumeX, AudioLines, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

// ── Soundwave bars for visual feedback ──
function SoundWaveBars({ color = 'bg-indigo-400', count = 5, className }: { color?: string; count?: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-[3px] h-5", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={cn(color, 'w-[3px] rounded-full')}
          style={{
            animation: `aiHubSoundwave 0.8s ease-in-out ${i * 0.12}s infinite alternate`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes aiHubSoundwave {
          0%   { height: 4px; }
          100% { height: 20px; }
        }
      `}</style>
    </div>
  );
}

function AiHubChatContent() {
  const searchParams = useSearchParams();
  const [conversationId, setConversationId] = useState<string | undefined>(searchParams.get('id') || undefined);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);

  const { data: conversation, isLoading: isLoadingHistory } = useAiHubConversation(conversationId);
  const chatMutation = useAiHubChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Local optimistic state
  const [messages, setMessages] = useState<any[]>([]);

  // ── Initialize SpeechSynthesis ──
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  useEffect(() => {
    if (conversation?.messages) {
      setMessages(conversation.messages);
      scrollToBottom();
    }
  }, [conversation]);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // ── Text-to-Speech ──
  const speak = useCallback((text: string) => {
    if (!synthRef.current || !autoSpeak) return;
    stopSpeaking();

    const cleanText = text
      .replace(/[#*_~`>|\\[\]()!]/g, '')
      .replace(/\n+/g, '. ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-CO';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = synthRef.current.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith('es')) || null;
    if (spanishVoice) utterance.voice = spanishVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    currentUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  }, [autoSpeak]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) synthRef.current.cancel();
    setIsSpeaking(false);
    currentUtteranceRef.current = null;
  }, []);

  // ── Send Text ──
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || chatMutation.isPending) return;

    const userMessage = inputMessage;
    setInputMessage('');

    const optimisticMsg = { id: Date.now().toString(), role: 'user', content: userMessage, createdAt: new Date() };
    setMessages(prev => [...prev, optimisticMsg]);
    scrollToBottom();

    chatMutation.mutate(
      { message: userMessage, conversationId },
      {
        onSuccess: (data) => {
          if (!conversationId && data.conversationId) {
            setConversationId(data.conversationId);
          }
          // Add assistant reply optimistically
          const assistantMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.reply, createdAt: new Date() };
          setMessages(prev => [...prev, assistantMsg]);
          scrollToBottom();
          speak(data.reply);
        },
      }
    );
  };

  // ── Voice Recording ──
  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            const base64data = reader.result as string;
            const voiceMsg = { id: Date.now().toString(), role: 'user', content: '🎤 Nota de voz enviada', createdAt: new Date() };
            setMessages(prev => [...prev, voiceMsg]);
            scrollToBottom();

            chatMutation.mutate(
              { message: '', audioBase64: base64data, mimeType: 'audio/webm', conversationId },
              {
                onSuccess: (data) => {
                  if (!conversationId && data.conversationId) setConversationId(data.conversationId);
                  const assistantMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.reply, createdAt: new Date() };
                  setMessages(prev => [...prev, assistantMsg]);
                  scrollToBottom();
                  speak(data.reply);
                },
                onError: (err) => {
                  console.error("Audio error", err);
                  const errMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Error al procesar el audio. Intenta de nuevo.', createdAt: new Date() };
                  setMessages(prev => [...prev, errMsg]);
                }
              }
            );
          };
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone", err);
        alert("No se pudo acceder al micrófono. Verifica los permisos del navegador.");
      }
    }
  };

  // ── Confirm Action ──
  const handleConfirmAction = async (toolCallId: string, confirmed: boolean) => {
    setMessages(prev => prev.map(m => m.id === toolCallId ? { ...m, resolved: true } : m));

    import('@/lib/axios').then(({ default: axios }) => {
      axios.post(`/ai-hub/confirm-action/${toolCallId}`, { confirmed })
        .then(() => {
          // Refetch conversation
        });
    });
  };

  const isProcessing = chatMutation.isPending;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">

      {/* ── Top Bar with voice controls ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
            isRecording
              ? "bg-red-500 text-white"
              : isSpeaking
              ? "bg-emerald-500 text-white"
              : "bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
          )}>
            {isRecording ? (
              <SoundWaveBars color="bg-white" count={4} />
            ) : isSpeaking ? (
              <AudioLines size={20} className="animate-pulse" />
            ) : (
              <Bot size={20} />
            )}
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">IA Hub</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isRecording
                ? '🔴 Escuchándote...'
                : isSpeaking
                ? '🔊 Hablando...'
                : isProcessing
                ? '⏳ Procesando...'
                : 'Asistente inteligente con voz'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setAutoSpeak(!autoSpeak); if (isSpeaking) stopSpeaking(); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
              autoSpeak
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
            )}
          >
            {autoSpeak ? <Volume2 size={14} /> : <VolumeX size={14} />}
            {autoSpeak ? 'Voz activa' : 'Voz silenciada'}
          </button>
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-5 shadow-xl shadow-indigo-500/20">
              <Bot size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">Hola, soy el IA Hub</h2>
            <p className="text-center max-w-lg mt-2 text-sm leading-relaxed">
              Puedo ayudarte a consultar clientes, enviar mensajes, analizar finanzas y orquestar el ERP.
              <br />
              <span className="text-indigo-500 font-medium">Háblame por voz o escríbeme.</span>
            </p>

            {/* Quick-start suggestions */}
            <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-md">
              {[
                { icon: '📩', text: '¿Tengo mensajes sin responder?' },
                { icon: '🔥', text: '¿Cuáles son mis leads calientes?' },
                { icon: '👤', text: 'Buscar un cliente' },
                { icon: '📅', text: 'Crear un recordatorio' },
              ].map(q => (
                <button
                  key={q.text}
                  onClick={() => setInputMessage(q.text)}
                  className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all"
                >
                  <span>{q.icon}</span>
                  {q.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={msg.id || idx} className={cn("flex gap-4 max-w-3xl", msg.role === 'user' ? "self-end flex-row-reverse" : "self-start")}>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                msg.role === 'user'
                  ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                  : "bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
              )}>
                {msg.role === 'user' ? <User size={18} /> : <Sparkles size={18} />}
              </div>
              <div className={cn(
                "px-5 py-3 rounded-2xl shadow-sm prose prose-sm dark:prose-invert max-w-none text-[13.5px] leading-relaxed",
                msg.role === 'user'
                  ? "bg-white text-slate-800 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 rounded-tr-sm"
                  : "bg-indigo-50 text-indigo-900 border border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-100 rounded-tl-sm"
              )}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>

                {/* Pending confirmation detection */}
                {msg.content.includes('requiere tu confirmación') && !msg.resolved && (
                  <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-500/30 rounded-lg flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-orange-800 dark:text-orange-300 font-semibold text-sm">
                      <ShieldAlert size={16} />
                      <span>Acción Sensible Pendiente</span>
                    </div>
                    <p className="text-xs text-orange-700 dark:text-orange-400">
                      La IA intentó ejecutar una herramienta restringida. Revisa los detalles.
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Button size="sm" onClick={() => handleConfirmAction(msg.id, true)} className="bg-orange-600 hover:bg-orange-700 text-white text-xs h-8">
                        <Check size={14} className="mr-1" /> Aprobar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleConfirmAction(msg.id, false)} className="border-orange-200 text-orange-700 hover:bg-orange-100 text-xs h-8">
                        <X size={14} className="mr-1" /> Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex gap-4 max-w-3xl self-start">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles size={18} />
            </div>
            <div className="px-5 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-tl-sm flex items-center gap-2">
              <Loader2 className="animate-spin text-indigo-600" size={16} />
              <span className="text-sm text-indigo-800 dark:text-indigo-200">Pensando y orquestando herramientas...</span>
            </div>
          </div>
        )}

        {/* Speaking indicator */}
        {isSpeaking && !isProcessing && (
          <div className="self-start flex items-center gap-2.5 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300">
            <SoundWaveBars color="bg-emerald-500" count={5} />
            <span className="font-medium">Reproduciendo respuesta...</span>
            <button onClick={stopSpeaking} className="ml-1 p-1 rounded-md hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors" title="Detener">
              <Square size={12} />
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Recording Banner ── */}
      {isRecording && (
        <div className="bg-gradient-to-r from-red-500 to-rose-500 px-6 py-2.5 flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="font-semibold">Grabando audio... Habla ahora</span>
          </div>
          <SoundWaveBars color="bg-white/80" count={8} />
        </div>
      )}

      {/* ── Input Bar ── */}
      <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto">
          {/* Mic Button */}
          <button
            type="button"
            onClick={toggleRecording}
            disabled={isProcessing}
            className={cn(
              "relative h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-all border",
              isRecording
                ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30"
                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400",
              isProcessing && "opacity-50 cursor-not-allowed"
            )}
            title={isRecording ? 'Detener grabación' : 'Mantén presionado para hablar'}
          >
            {isRecording ? <Square size={18} /> : <Mic size={18} />}
          </button>

          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={isRecording ? "Grabando audio..." : "Pregúntale a tu asistente IA..."}
            className="flex-1 shadow-sm h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-visible:ring-indigo-500"
            disabled={isRecording || isProcessing}
          />

          <Button
            type="submit"
            disabled={(!inputMessage.trim() && !isRecording) || isProcessing}
            className={cn(
              "h-12 px-6 rounded-xl shadow-sm transition-all",
              inputMessage.trim()
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700"
            )}
          >
            <Send size={18} className="mr-2" />
            Enviar
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function AiHubChatPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center text-slate-500 text-sm">Cargando interfaz de chat...</div>}>
      <AiHubChatContent />
    </Suspense>
  );
}
