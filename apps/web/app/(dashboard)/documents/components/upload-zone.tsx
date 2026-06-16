"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadDocument } from "@/hooks/api/use-documents";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function UploadZone() {
  const [open, setOpen] = useState(false);
  const { mutate: uploadDoc, isPending } = useUploadDocument();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadDoc(acceptedFiles[0], {
        onSuccess: () => setOpen(false),
      });
    }
  }, [uploadDoc]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UploadCloud className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <div
          {...getRootProps()}
          className={`mt-4 border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
            ${isDragActive ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50 hover:bg-muted/50"}
            ${isPending ? "pointer-events-none opacity-50" : ""}
          `}
        >
          <input {...getInputProps()} />
          
          {isPending ? (
            <div className="flex flex-col items-center justify-center text-primary">
              <Loader2 className="h-10 w-10 animate-spin mb-4" />
              <p className="text-sm font-medium">Uploading and processing...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <UploadCloud className={`h-12 w-12 mb-4 ${isDragActive ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-base font-medium mb-1">
                {isDragActive ? "Drop the file here" : "Drag & drop a file here"}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to select from your computer
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Supports PDF, JPG, PNG for OCR data extraction
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
