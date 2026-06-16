"use client";

import { useOCRData } from "@/hooks/api/use-documents";
import { Loader2, ScanText, Copy, Check, FileJson } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface OCRViewerProps {
  documentId: string;
  fileUrl: string;
}

export function OCRViewer({ documentId, fileUrl }: OCRViewerProps) {
  const { data: ocrData, isLoading } = useOCRData(documentId);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (ocrData?.text) {
      navigator.clipboard.writeText(ocrData.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/20 rounded-xl border">
        <div className="flex flex-col items-center text-muted-foreground">
          <ScanText className="w-10 h-10 mb-4 animate-pulse text-primary" />
          <p>Extracting data using AI OCR...</p>
        </div>
      </div>
    );
  }

  if (!ocrData) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
      <Card className="h-full flex flex-col overflow-hidden bg-muted/10">
        <CardHeader className="p-3 border-b bg-background">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>Document Preview</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 relative">
          {/* In a real app, this would be a PDF viewer or image tag depending on mimeType */}
          <iframe src={fileUrl} className="w-full h-full border-0" title="Document Preview" />
        </CardContent>
      </Card>

      <Card className="h-full flex flex-col">
        <CardHeader className="p-3 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ScanText className="w-4 h-4 text-primary" /> 
            Extracted Data
            {ocrData.confidence > 0 && (
              <Badge variant="outline" className="ml-2 text-[10px] bg-green-50 text-green-700 border-green-200">
                {Math.round(ocrData.confidence * 100)}% Confidence
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyToClipboard} title="Copy full text">
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {Object.keys(ocrData.entities || {}).length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <FileJson className="w-3.5 h-3.5" /> Structured Entities
                  </h3>
                  <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-lg border">
                    {Object.entries(ocrData.entities).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-[10px] text-muted-foreground uppercase">{key}</span>
                        <p className="text-sm font-medium break-words">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Raw Text Content</h3>
                <div className="bg-muted/20 p-3 rounded-lg font-mono text-xs whitespace-pre-wrap text-foreground/80 leading-relaxed border">
                  {ocrData.text || "No text could be extracted from this document."}
                </div>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
