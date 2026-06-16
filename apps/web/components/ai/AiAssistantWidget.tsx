'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, X, Mic, Send, Loader2, Square, Volume2, VolumeX, AudioLines } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAiHubChat } from '@/hooks/api/use-ai-hub';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

// ── Animated Soundwave Bars (visual feedback while recording / speaking) ──
function SoundWaveBars({ color = 'bg-indigo-400', count = 5 }: { color?: string; count?: number }) {
  return (
    <div className="flex items-center gap-[3px] h-5">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={cn(color, 'w-[3px] rounded-full')}
          style={{
            animation: `soundwave 0.8s ease-in-out ${i * 0.12}s infinite alternate`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes soundwave {
          0%   { height: 4px; }
          100% { height: 18px; }
        }
      `}</style>
    </div>
  );
}

// ── Pulsating ring animation for the FAB while recording ──
function PulseRing() {
  return (
    <>
      <span className="absolute inset-0 rounded-full bg-red-500 opacity-30 animate-ping" />
      <span className="absolute inset-[-4px] rounded-full border-2 border-red-400 opacity-50 animate-pulse" />
    </>
  );
}

// ── Main Widget ──
export function AiAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [conversationId, setConversationId] = useState<string | undefined>();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const chatMutation = useAiHubChat();

  // ── Initialize SpeechSynthesis ──
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // ── Scroll to bottom on new messages ──
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [isOpen, messages]);

  // ── Stop speech when closing widget ──
  useEffect(() => {
    if (!isOpen) stopSpeaking();
  }, [isOpen]);

  // ── Text-to-Speech ──
  const speak = useCallback((text: string) => {
    if (!text || !synthRef.current || !autoSpeak) return;
    stopSpeaking();

    // Strip markdown formatting for cleaner speech
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

    // Try to pick a Spanish voice
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
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
    currentUtteranceRef.current = null;
  }, []);

  // ── Helpers ──
  const addMessage = (msg: any) => {
    setMessages(prev => [...prev, { ...msg, id: Date.now().toString() }]);
  };

  // ── Send Text ──
  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const msg = input;
    setInput('');
    addMessage({ role: 'user', content: msg });

    chatMutation.mutate(
      { message: msg, conversationId },
      {
        onSuccess: (data) => {
          const finalConversationId = data.conversationId || data.data?.conversationId;
          const finalReply = data.reply || data.data?.reply || "No pude procesar la respuesta.";
          
          if (!conversationId && finalConversationId) setConversationId(finalConversationId);
          addMessage({ role: 'assistant', content: finalReply });
          speak(finalReply);
        },
        onError: (err) => {
          console.error("Chat error", err);
          const errMsg = "Lo siento, ha ocurrido un error al procesar tu solicitud.";
          addMessage({ role: 'assistant', content: errMsg });
        }
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
            addMessage({ role: 'user', content: '🎤 Nota de voz enviada' });
            chatMutation.mutate(
              { message: '', audioBase64: base64data, mimeType: 'audio/webm', conversationId },
              {
                onSuccess: (data) => {
                  const finalConversationId = data.conversationId || data.data?.conversationId;
                  const finalReply = data.reply || data.data?.reply || "No pude procesar la respuesta de audio.";
                  
                  if (!conversationId && finalConversationId) setConversationId(finalConversationId);
                  addMessage({ role: 'assistant', content: finalReply });
                  speak(finalReply);
                },
                onError: (err) => {
                  console.error("Audio error", err);
                  addMessage({ role: 'assistant', content: "Error al procesar el audio. Intenta de nuevo." });
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

  // ── Derived states ──
  const isProcessing = chatMutation.isPending;
  const headerStatus = isRecording
    ? 'Escuchándote...'
    : isSpeaking
    ? 'Hablando...'
    : isProcessing
    ? 'Pensando...'
    : 'Asistente de Voz';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-white dark:bg-slate-950 w-[400px] h-[580px] mb-4 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* ── Header ── */}
          <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white px-4 py-3 flex items-center justify-between">
            {/* Animated background shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="relative">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                  isRecording ? "bg-red-500" : isSpeaking ? "bg-emerald-500" : "bg-white/15"
                )}>
                  {isRecording ? (
                    <SoundWaveBars color="bg-white" count={4} />
                  ) : isSpeaking ? (
                    <AudioLines size={20} className="animate-pulse" />
                  ) : (
                    <Bot size={20} />
                  )}
                </div>
                {/* Live indicator dot */}
                <span className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-indigo-600 transition-colors",
                  isRecording ? "bg-red-400 animate-pulse" : isSpeaking ? "bg-emerald-400 animate-pulse" : "bg-emerald-400"
                )} />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-none">IA Hub</h3>
                <p className="text-[11px] text-white/70 mt-0.5">{headerStatus}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 relative z-10">
              {/* Auto-speak toggle */}
              <button
                onClick={() => { setAutoSpeak(!autoSpeak); if (isSpeaking) stopSpeaking(); }}
                className={cn(
                  "p-1.5 rounded-full transition-colors",
                  autoSpeak ? "bg-white/15 text-white" : "bg-white/5 text-white/40"
                )}
                title={autoSpeak ? "Silenciar respuestas de voz" : "Activar respuestas de voz"}
              >
                {autoSpeak ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ── Chat Area ── */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50 dark:bg-slate-900/80">
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                  <Bot size={32} className="text-white" />
                </div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-base">¡Hola! Soy tu asistente</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 leading-relaxed">
                  Háblame por voz o escríbeme. Puedo buscar clientes, agendar tareas, consultar leads y más.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {['¿Mensajes pendientes?', '¿Mis leads calientes?', 'Buscar cliente'].map(q => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); }}
                      className="text-[11px] px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex max-w-[88%]", msg.role === 'user' ? "self-end justify-end" : "self-start")}>
                <div className={cn(
                  "p-3 rounded-2xl text-[13px] leading-relaxed prose prose-sm dark:prose-invert max-w-none",
                  msg.role === 'user'
                    ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-sm shadow-sm shadow-indigo-500/20"
                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-sm text-slate-700 dark:text-slate-200 shadow-sm"
                )}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))}

            {/* Processing state */}
            {isProcessing && (
              <div className="self-start bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm p-3 text-[13px] flex items-center gap-2 shadow-sm">
                <Loader2 size={14} className="animate-spin text-indigo-600" />
                <span className="text-slate-600 dark:text-slate-300">Pensando y orquestando...</span>
              </div>
            )}

            {/* Speaking feedback in chat */}
            {isSpeaking && !isProcessing && (
              <div className="self-start flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-700 dark:text-emerald-300">
                <SoundWaveBars color="bg-emerald-500" count={4} />
                <span>Reproduciendo respuesta...</span>
                <button onClick={stopSpeaking} className="ml-1 p-0.5 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors">
                  <Square size={10} />
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Recording Banner ── */}
          {isRecording && (
            <div className="bg-gradient-to-r from-red-500 to-rose-500 px-4 py-2 flex items-center justify-between text-white text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="font-medium">Grabando audio...</span>
              </div>
              <SoundWaveBars color="bg-white/80" count={6} />
            </div>
          )}

          {/* ── Input Area ── */}
          <div className="p-3 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
            <form onSubmit={handleSendText} className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleRecording}
                disabled={isProcessing}
                className={cn(
                  "relative p-2.5 rounded-full transition-all flex-shrink-0",
                  isRecording
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 dark:hover:text-indigo-400",
                  isProcessing && "opacity-50 cursor-not-allowed"
                )}
              >
                {isRecording ? <Square size={18} /> : <Mic size={18} />}
              </button>
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={isRecording ? "Grabando..." : "Escribe un mensaje..."}
                className="flex-1 rounded-full border-slate-200 dark:border-slate-700 h-10 text-sm bg-slate-50 dark:bg-slate-900 focus-visible:ring-indigo-500"
                disabled={isRecording || isProcessing}
              />
              <button
                type="submit"
                disabled={(!input.trim() && !isRecording) || isProcessing}
                className={cn(
                  "p-2.5 rounded-full flex-shrink-0 transition-all",
                  input.trim()
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/20 hover:shadow-md"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                )}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── FAB (Floating Action Button) ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95",
          isRecording
            ? "bg-red-500 hover:bg-red-600"
            : "bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700",
          "text-white"
        )}
      >
        {isRecording && <PulseRing />}
        <span className="relative z-10">
          {isOpen ? <X size={26} /> : <Bot size={26} />}
        </span>
      </button>
    </div>
  );
}
