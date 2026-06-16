"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useImportData } from "@/hooks/api/use-reports";
import { Settings, Link as LinkIcon, Upload, Loader2, CheckCircle2 } from "lucide-react";

export function DataImportDialog() {
  const [open, setOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");
  const [csvContent, setCsvContent] = useState("");
  const { mutate: importData, isPending } = useImportData();

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl) return;
    importData({ type: "link", content: sheetUrl }, {
      onSuccess: (data) => {
        if (data.success) setOpen(false);
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setCsvContent(text);
      }
    };
    reader.readAsText(file);
  };

  const handleCsvSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvContent) return;
    importData({ type: "csv", content: csvContent }, {
      onSuccess: (data) => {
        if (data.success) {
          setOpen(false);
          setCsvContent("");
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="w-4 h-4" />
          Configurar Datos Reales
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar Bases de Datos</DialogTitle>
          <DialogDescription>
            Conecta tus reportes de Finanzas, Empleados o Portafolio con datos reales para reemplazar las métricas de prueba.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link" className="gap-2">
              <LinkIcon className="w-4 h-4" />
              Enlace de Google Sheets
            </TabsTrigger>
            <TabsTrigger value="csv" className="gap-2">
              <Upload className="w-4 h-4" />
              Subir CSV
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="mt-4">
            <form onSubmit={handleLinkSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sheet-url">Enlace público de Google Sheets</Label>
                <Input 
                  id="sheet-url" 
                  placeholder="https://docs.google.com/spreadsheets/d/..." 
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  required
                />
                <p className="text-[10px] text-muted-foreground">
                  Asegúrate de que la hoja esté configurada como "Cualquier persona con el enlace puede leer".
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={isPending || !sheetUrl}>
                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Sincronizar Datos
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="csv" className="mt-4">
            <form onSubmit={handleCsvSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csv-file">Archivo .CSV (Descargado de Excel o Sheets)</Label>
                <Input 
                  id="csv-file" 
                  type="file" 
                  accept=".csv"
                  onChange={handleFileUpload}
                  required
                />
              </div>
              {csvContent && (
                <div className="bg-green-500/10 text-green-600 p-2 rounded flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Archivo leído correctamente. Listo para importar.
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isPending || !csvContent}>
                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Subir y Actualizar Gráficas
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
