'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Sparkles, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

export default function GeneratorPage() {
  const { accessToken: token } = useAuthStore();
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [uploadedAssets, setUploadedAssets] = useState<{ url: string, name: string }[]>([]);

  // Función para subir rostros o logos
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'brand-assets');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/content-studio/assets/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      const data = await res.json();
      const payload = data.data?.data || data.data || data;
      if (payload.url || data.success) {
        setUploadedAssets([...uploadedAssets, { url: payload.url || data.data?.url, name: file.name }]);
        // Opcional: Agregar el contexto de la imagen al prompt
        setPrompt(prev => prev + `\n[Nota: Usa el estilo o rostro provisto en la referencia subida: ${file.name}]`);
      } else {
        alert(data.message || 'Error subiendo archivo');
      }
    } catch (error) {
      console.error(error);
      alert('Error de red al subir archivo');
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setGeneratedImage(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/content-studio/images/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt,
          aspectRatio
        }),
      });
      
      const data = await res.json();
      const payload = data.data || data;
      if (payload.success && payload.localBase64) {
        // Mostramos el base64 directamente o la URL pública (payload.url)
        setGeneratedImage(payload.localBase64);
      } else {
        alert(data.message || 'Error al generar imagen');
      }
    } catch (error) {
      console.error(error);
      alert('Error de red generando imagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
      {/* Editor Panel */}
      <div className="md:col-span-5 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Image Studio</h1>
          <p className="text-muted-foreground mt-2">
            Genera imágenes fotorealistas impulsadas por Gemini (Imagen 3).
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prompt Visual</CardTitle>
            <CardDescription>Describe la imagen en detalle.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              placeholder="Un ejecutivo militar en una oficina moderna, iluminación cinematográfica, 8k, photorealistic..." 
              className="min-h-[150px] resize-none"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Referencias (Rostros / Logos)</CardTitle>
            <CardDescription>Sube imágenes de marca para guiar a la IA.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {uploadedAssets.map((asset, idx) => (
                <div key={idx} className="relative w-16 h-16 border rounded overflow-hidden">
                  <img src={asset.url} alt={asset.name} className="object-cover w-full h-full" />
                </div>
              ))}
              <label className="flex flex-col items-center justify-center w-16 h-16 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <Upload className="h-5 w-5 text-slate-400" />
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Formato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {['1:1', '3:4', '9:16', '16:9'].map(ratio => (
                <Button 
                  key={ratio} 
                  variant={aspectRatio === ratio ? 'default' : 'outline'}
                  onClick={() => setAspectRatio(ratio)}
                  className="flex-1"
                >
                  {ratio}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button 
          className="w-full h-12 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md"
          onClick={handleGenerate}
          disabled={loading || !prompt}
        >
          {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
          Generar con Gemini
        </Button>
      </div>

      {/* Preview Panel */}
      <div className="md:col-span-7">
        <Card className="h-full min-h-[600px] flex flex-col bg-slate-50/50">
          <CardHeader>
            <CardTitle className="text-lg">Resultado</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center p-6">
            {loading ? (
              <div className="flex flex-col items-center text-slate-400 animate-pulse">
                <div className="h-32 w-32 relative mb-4">
                  <div className="absolute inset-0 border-4 border-indigo-200 rounded-full animate-spin border-t-indigo-600"></div>
                  <Sparkles className="absolute inset-0 m-auto h-12 w-12 text-indigo-400" />
                </div>
                <p>Procesando en servidores de Google (Imagen 3)...</p>
              </div>
            ) : generatedImage ? (
              <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden shadow-2xl border border-slate-200">
                <img src={generatedImage} alt="Generado por Gemini" className="w-full h-full object-contain bg-white" />
              </div>
            ) : (
              <div className="flex flex-col items-center text-slate-400">
                <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
                <p>El lienzo está vacío. Escribe un prompt para comenzar.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
