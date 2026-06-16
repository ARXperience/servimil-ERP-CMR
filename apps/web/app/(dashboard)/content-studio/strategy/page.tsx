'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Sparkles, Loader2, Target, Users, Megaphone, Type,
  Save, History, Image as ImageIcon, Heart, MessageCircle,
  Send, Bookmark, MoreHorizontal, ChevronRight, Clock,
  CheckCircle2, Edit3, X
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

const API = process.env.NEXT_PUBLIC_API_URL;

// Format badge colors
const FORMAT_COLORS: Record<string, string> = {
  FEED_SQUARE: 'bg-blue-100 text-blue-700',
  REEL: 'bg-purple-100 text-purple-700',
  CAROUSEL: 'bg-emerald-100 text-emerald-700',
  STORY: 'bg-amber-100 text-amber-700',
  FEED_VERTICAL: 'bg-cyan-100 text-cyan-700',
};

const FORMAT_LABELS: Record<string, string> = {
  FEED_SQUARE: '📐 Feed',
  REEL: '🎬 Reel',
  CAROUSEL: '📸 Carousel',
  STORY: '📱 Story',
  FEED_VERTICAL: '📐 Vertical',
};

export default function StrategyPage() {
  const { accessToken: token } = useAuthStore();

  // Form state
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    objective: '',
    keywords: '',
    audience: '',
    serviceOrProduct: '',
    brandTone: ''
  });

  // Generated result (before save)
  const [result, setResult] = useState<any>(null);

  // Save dialog
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [strategyName, setStrategyName] = useState('');
  const [saving, setSaving] = useState(false);

  // Save strategy (after save, with DB IDs for posts)
  const [savedStrategy, setSavedStrategy] = useState<any>(null);

  // Logo Upload State
  const [brandContext, setBrandContext] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // History
  const [showHistory, setShowHistory] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploadingLogo(true);
    const formDataObj = new FormData();
    formDataObj.append('file', file);

    try {
      const res = await fetch(`${API}/content-studio/analyze-brand`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataObj
      });
      const data = await res.json();
      const payload = data.data?.data || data.data || data;
      if (payload.brandContext || data.success) {
        setBrandContext(payload.brandContext || data.data?.brandContext);
      } else {
        alert(data.message || 'Error analizando logo');
      }
    } catch (error) {
      console.error(error);
      alert('Error subiendo logo');
    } finally {
      setUploadingLogo(false);
    }
  };
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Per-post image generation loading
  const [generatingImage, setGeneratingImage] = useState<Record<string, boolean>>({});

  // Editable copy
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editCopy, setEditCopy] = useState('');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // ─── GENERATE STRATEGY ──────────────────────
  const handleGenerate = async () => {
    if (!formData.objective || !formData.keywords) return;
    setLoading(true);
    setResult(null);
    setSavedStrategy(null);

    try {
      const res = await fetch(`${API}/content-studio/strategy/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...formData,
          keywords: formData.keywords.split(',').map(k => k.trim()),
          brandContext
        }),
      });

      const data = await res.json();
      const payload = data.data?.data || data.data || data;
      if (payload.objective) {
        setResult(payload);
      } else {
        alert(data.message || 'Error al generar estrategia');
      }
    } catch (error) {
      console.error(error);
      alert('Error de red generando estrategia');
    } finally {
      setLoading(false);
    }
  };

  // ─── SAVE STRATEGY ──────────────────────────
  const handleSave = async () => {
    if (!strategyName.trim() || !result) return;
    setSaving(true);

    try {
      const res = await fetch(`${API}/content-studio/strategy/save`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: strategyName,
          keywords: formData.keywords.split(',').map(k => k.trim()),
          objective: formData.objective,
          audience: formData.audience,
          serviceOrProduct: formData.serviceOrProduct,
          brandTone: formData.brandTone,
          pillars: result.pillars,
          generatedIdeas: result.generatedIdeas,
        }),
      });

      const data = await res.json();
      const payload = data.data?.data || data.data || data;
      if (payload.id) {
        setSavedStrategy(payload);
        setResult(null);
        setShowSaveDialog(false);
        setStrategyName('');
      } else {
        alert('Error guardando estrategia');
      }
    } catch (error) {
      console.error(error);
      alert('Error de red al guardar');
    } finally {
      setSaving(false);
    }
  };

  // ─── LOAD HISTORY ───────────────────────────
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API}/content-studio/strategy`, { headers });
      const data = await res.json();
      const payload = data.data?.data || data.data || [];
      setStrategies(Array.isArray(payload) ? payload : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  // ─── LOAD SINGLE STRATEGY ──────────────────
  const loadStrategy = async (id: string) => {
    try {
      const res = await fetch(`${API}/content-studio/strategy/${id}`, { headers });
      const data = await res.json();
      const payload = data.data?.data || data.data || data;
      if (payload.id) {
        setSavedStrategy(payload);
        setResult(null);
        setShowHistory(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ─── GENERATE IMAGE FOR POST ────────────────
  const handleGenerateImage = async (postId: string) => {
    setGeneratingImage(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`${API}/content-studio/posts/${postId}/generate-image`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ brandContext }),
      });
      const data = await res.json();
      const payload = data.data?.data || data.data || data;

      if (payload.imageUrl) {
        // Refresh the strategy to get updated image
        if (savedStrategy?.id) {
          await loadStrategy(savedStrategy.id);
        }
      } else {
        alert('Error generando imagen');
      }
    } catch (e) {
      console.error(e);
      alert('Error de red al generar imagen');
    } finally {
      setGeneratingImage(prev => ({ ...prev, [postId]: false }));
    }
  };

  // ─── SAVE EDITED COPY ──────────────────────
  const handleSaveCopy = async (postId: string) => {
    try {
      await fetch(`${API}/content-studio/posts/${postId}/copy`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ copyText: editCopy }),
      });
      setEditingPost(null);
      if (savedStrategy?.id) {
        await loadStrategy(savedStrategy.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ─── Active data: either unsaved result or saved strategy ───
  const activeData = savedStrategy || result;
  const posts = savedStrategy?.posts || [];
  const ideas = result?.generatedIdeas || [];

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Content Studio AI
          </h1>
          <p className="text-muted-foreground mt-1">
            Genera, edita y produce contenido para Instagram con Gemini 2.5
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowHistory(!showHistory); if (!showHistory) loadHistory(); }}
          >
            <History className="h-4 w-4 mr-2" />
            Historial
          </Button>
        </div>
      </div>

      {/* History Sidebar */}
      {showHistory && (
        <Card className="mb-6 border-indigo-200 bg-indigo-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" /> Estrategias Guardadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="text-center text-sm text-muted-foreground py-4">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                Cargando...
              </div>
            ) : strategies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay estrategias guardadas aún.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {strategies.map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => loadStrategy(s.id)}
                    className="text-left p-3 rounded-lg border bg-white hover:border-indigo-400 hover:shadow-md transition-all group"
                  >
                    <div className="font-semibold text-sm text-slate-800 group-hover:text-indigo-600 truncate">
                      {s.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {new Date(s.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {s.createdBy && (
                        <span className="ml-auto text-slate-400">
                          {s.createdBy.firstName} {s.createdBy.lastName}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {s.posts?.length || 0} ideas · {s.objective?.substring(0, 50)}...
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ─── LEFT: Form Panel ─── */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Configuración de Campaña</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium flex items-center gap-1.5 text-slate-600">
                  <Target className="h-3.5 w-3.5" /> Objetivo
                </label>
                <Input
                  placeholder="Ej. Incrementar ventas de créditos"
                  value={formData.objective}
                  onChange={e => setFormData({...formData, objective: e.target.value})}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium flex items-center gap-1.5 text-slate-600">
                  <Megaphone className="h-3.5 w-3.5" /> Keywords (separadas por coma)
                </label>
                <Input
                  placeholder="crédito rápido, sin codeudor"
                  value={formData.keywords}
                  onChange={e => setFormData({...formData, keywords: e.target.value})}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium flex items-center gap-1.5 text-slate-600">
                  <Users className="h-3.5 w-3.5" /> Público Objetivo
                </label>
                <Input
                  placeholder="Militares activos y pensionados"
                  value={formData.audience}
                  onChange={e => setFormData({...formData, audience: e.target.value})}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium flex items-center gap-1.5 text-slate-600">
                  Producto / Servicio
                </label>
                <Input
                  placeholder="Créditos personales"
                  value={formData.serviceOrProduct}
                  onChange={e => setFormData({...formData, serviceOrProduct: e.target.value})}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium flex items-center gap-1.5 text-slate-600">
                  <Type className="h-3.5 w-3.5" /> Tono de Marca
                </label>
                <Input
                  placeholder="Institucional, confiable"
                  value={formData.brandTone}
                  onChange={e => setFormData({...formData, brandTone: e.target.value})}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium flex items-center gap-1.5 text-indigo-600">
                  <ImageIcon className="h-3.5 w-3.5" /> Logo / Identidad (Análisis IA)
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="h-9 text-sm file:bg-indigo-50 file:text-indigo-700 file:border-0 file:rounded-md file:px-2 file:py-1 file:mr-2 file:text-xs file:font-medium hover:file:bg-indigo-100"
                />
                {uploadingLogo && <p className="text-xs text-indigo-500 animate-pulse mt-1">Analizando logo con Gemini Vision...</p>}
                {brandContext && (
                  <div className="mt-2 p-2 bg-indigo-50 rounded text-xs text-indigo-800 border border-indigo-100">
                    <strong>Identidad detectada:</strong> {brandContext.substring(0, 100)}...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
            onClick={handleGenerate}
            disabled={loading || !formData.objective || !formData.keywords}
          >
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
            Generar Parrilla IA
          </Button>

          {/* Save button (only when we have unsaved result) */}
          {result && !savedStrategy && (
            <Button
              variant="outline"
              className="w-full h-10 border-green-300 text-green-700 hover:bg-green-50"
              onClick={() => setShowSaveDialog(true)}
            >
              <Save className="mr-2 h-4 w-4" />
              Guardar Estrategia
            </Button>
          )}

          {/* Save Dialog */}
          {showSaveDialog && (
            <Card className="border-green-300 bg-green-50/30">
              <CardContent className="pt-4 flex flex-col gap-3">
                <label className="text-sm font-medium text-green-800">Nombre de la Estrategia</label>
                <Input
                  placeholder="Ej. Campaña Julio - Créditos Militares"
                  value={strategyName}
                  onChange={e => setStrategyName(e.target.value)}
                  className="h-9"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleSave}
                    disabled={saving || !strategyName.trim()}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                    Guardar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowSaveDialog(false)}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Saved strategy info */}
          {savedStrategy && (
            <Card className="border-indigo-200 bg-indigo-50/30">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-indigo-700 mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-semibold text-sm">Estrategia Guardada</span>
                </div>
                <p className="text-sm font-medium text-slate-800">{savedStrategy.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(savedStrategy.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {savedStrategy.createdBy && ` · ${savedStrategy.createdBy.firstName} ${savedStrategy.createdBy.lastName}`}
                </p>
                <p className="text-xs text-slate-500 mt-1">{savedStrategy.posts?.length || 0} posts creados</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ─── RIGHT: Results Panel ─── */}
        <div className="lg:col-span-8">
          {loading ? (
            <Card className="min-h-[600px] flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
              <div className="flex flex-col items-center text-slate-500 animate-pulse">
                <div className="relative mb-6">
                  <div className="h-20 w-20 border-4 border-indigo-200 rounded-full animate-spin border-t-indigo-600" />
                  <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-indigo-500" />
                </div>
                <p className="text-lg font-medium">Generando estrategia con Gemini 2.5...</p>
                <p className="text-sm text-slate-400 mt-1">Analizando mercado y creando contenido</p>
              </div>
            </Card>
          ) : activeData ? (
            <div className="space-y-6">
              {/* Objective & Pillars */}
              <Card className="bg-gradient-to-r from-slate-50 to-indigo-50/30">
                <CardContent className="pt-5">
                  <h3 className="font-bold text-base text-slate-800 mb-1">🎯 Objetivo Estratégico</h3>
                  <p className="text-sm text-slate-600">{activeData.objective}</p>

                  {activeData.pillars && activeData.pillars.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Pilares de Contenido</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {activeData.pillars.map((p: any, i: number) => (
                          <div key={i} className="p-2.5 rounded-md border border-l-4 border-l-indigo-500 bg-white">
                            <p className="font-medium text-xs text-slate-800">{p.name}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{p.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Instagram Posts Grid */}
              <div>
                <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                  <span className="text-2xl">📱</span> Contenido para Instagram
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full ml-auto">
                    {savedStrategy ? `${posts.length} posts` : `${ideas.length} ideas`}
                  </span>
                </h3>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {/* Render saved posts (with DB IDs) */}
                  {savedStrategy && posts.map((post: any) => (
                    <InstagramMockup
                      key={post.id}
                      post={post}
                      imageUrl={post.generatedImages?.[0]?.imageUrl}
                      isGenerating={generatingImage[post.id]}
                      onGenerateImage={() => handleGenerateImage(post.id)}
                      isEditing={editingPost === post.id}
                      editCopy={editCopy}
                      onStartEdit={() => { setEditingPost(post.id); setEditCopy(post.copyText || ''); }}
                      onCancelEdit={() => setEditingPost(null)}
                      onSaveCopy={() => handleSaveCopy(post.id)}
                      onEditCopyChange={setEditCopy}
                    />
                  ))}

                  {/* Render unsaved ideas (no DB IDs yet) */}
                  {!savedStrategy && ideas.map((idea: any, i: number) => (
                    <InstagramMockup
                      key={i}
                      post={{
                        title: idea.title,
                        format: idea.format,
                        copyText: idea.copyText,
                        visualPrompt: idea.visualPrompt,
                        hashtags: idea.hashtags,
                        cta: idea.cta,
                      }}
                      imageUrl={null}
                      isGenerating={false}
                      onGenerateImage={null}
                      isEditing={false}
                      editCopy=""
                      onStartEdit={null}
                      onCancelEdit={() => {}}
                      onSaveCopy={() => {}}
                      onEditCopyChange={() => {}}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <Card className="min-h-[600px] flex items-center justify-center bg-slate-50/50">
              <div className="flex flex-col items-center text-slate-400">
                <Target className="h-16 w-16 mb-4 opacity-30" />
                <p className="text-lg font-medium">Completa el formulario</p>
                <p className="text-sm mt-1">para generar tu parrilla de contenido</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// INSTAGRAM MOCKUP COMPONENT
// ═══════════════════════════════════════════════════
function InstagramMockup({
  post,
  imageUrl,
  isGenerating,
  onGenerateImage,
  isEditing,
  editCopy,
  onStartEdit,
  onCancelEdit,
  onSaveCopy,
  onEditCopyChange,
}: {
  post: any;
  imageUrl: string | null;
  isGenerating: boolean;
  onGenerateImage: (() => void) | null;
  isEditing: boolean;
  editCopy: string;
  onStartEdit: (() => void) | null;
  onCancelEdit: () => void;
  onSaveCopy: () => void;
  onEditCopyChange: (v: string) => void;
}) {
  const formatClass = FORMAT_COLORS[post.format] || 'bg-slate-100 text-slate-600';
  const formatLabel = FORMAT_LABELS[post.format] || post.format;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      {/* IG Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
          <span className="text-white text-xs font-bold">S</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800">servimil_oficial</p>
          <p className="text-[10px] text-slate-400">Patrocinado</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${formatClass}`}>
          {formatLabel}
        </span>
        <MoreHorizontal className="h-4 w-4 text-slate-400" />
      </div>

      {/* Image Area */}
      <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 aspect-square flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={post.title} className="w-full h-full object-cover" />
        ) : isGenerating ? (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <div className="relative">
              <div className="h-16 w-16 border-4 border-purple-200 rounded-full animate-spin border-t-purple-600" />
              <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-purple-400" />
            </div>
            <p className="text-sm font-medium">Generando imagen con IA...</p>
            <p className="text-xs text-slate-400">Imagen 3 (Google)</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 text-slate-400 p-6 text-center h-full">
            <ImageIcon className="h-12 w-12 opacity-40 shrink-0" />
            <div className="overflow-y-auto max-h-[50%] w-full custom-scrollbar">
              <p className="text-xs font-medium text-slate-500 leading-relaxed">{post.visualPrompt}</p>
            </div>
            {onGenerateImage && (
              <Button
                size="sm"
                className="mt-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md"
                onClick={onGenerateImage}
              >
                <Sparkles className="h-4 w-4 mr-1.5" />
                Generar Imagen IA
              </Button>
            )}
          </div>
        )}
      </div>

      {/* IG Actions */}
      <div className="px-4 pt-3 flex items-center justify-between">
        <div className="flex gap-4">
          <Heart className="h-6 w-6 text-slate-700 hover:text-red-500 cursor-pointer transition-colors" />
          <MessageCircle className="h-6 w-6 text-slate-700 hover:text-blue-500 cursor-pointer transition-colors" />
          <Send className="h-6 w-6 text-slate-700 hover:text-indigo-500 cursor-pointer transition-colors" />
        </div>
        <Bookmark className="h-6 w-6 text-slate-700 hover:text-amber-500 cursor-pointer transition-colors" />
      </div>

      {/* Likes */}
      <div className="px-4 pt-2">
        <p className="text-xs font-semibold text-slate-800">1,247 Me gusta</p>
      </div>

      {/* Copy Text */}
      <div className="px-4 pt-1 pb-2">
        <div className="flex items-start gap-1">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editCopy}
                  onChange={e => onEditCopyChange(e.target.value)}
                  className="text-sm min-h-[100px] resize-none"
                />
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={onSaveCopy}>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Guardar
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancelEdit}>
                    <X className="h-3 w-3 mr-1" /> Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                <span className="font-semibold text-slate-800">servimil_oficial </span>
                {post.copyText}
              </p>
            )}
          </div>
          {!isEditing && onStartEdit && (
            <button
              onClick={onStartEdit}
              className="mt-1 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              title="Editar copy"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-1">
            {post.hashtags.map((tag: string, j: number) => (
              <span key={j} className="text-[11px] text-blue-500 hover:text-blue-700 cursor-pointer">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      {post.cta && (
        <div className="px-4 pb-3">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-2.5 flex items-center justify-between border border-indigo-100">
            <span className="text-xs font-medium text-indigo-700">{post.cta}</span>
            <ChevronRight className="h-4 w-4 text-indigo-500" />
          </div>
        </div>
      )}

      {/* Post Title */}
      <div className="px-4 pb-3 border-t pt-2">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{post.title}</p>
      </div>
    </div>
  );
}
