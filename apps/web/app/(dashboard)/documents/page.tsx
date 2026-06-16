"use client";

import { useDocuments } from "@/hooks/api/use-documents";
import { format } from "date-fns";
import { Loader2, FileText, File, FileImage, FileBarChart, MoreVertical, Search, UploadCloud, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState } from "react";
import { UploadZone } from "./components/upload-zone";

export default function DocumentsPage() {
  const { data: documents, isLoading } = useDocuments();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const docsList = documents || [];
  const filteredDocs = docsList.filter(
    (d) => (d.title || (d as any).name || "").toLowerCase().includes(search.toLowerCase())
  );

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) return <FileText className="w-6 h-6 text-red-500" />;
    if (mimeType.includes("image")) return <FileImage className="w-6 h-6 text-blue-500" />;
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return <FileBarChart className="w-6 h-6 text-green-500" />;
    return <File className="w-6 h-6 text-gray-500" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="p-6 space-y-6 flex flex-col h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents & OCR</h1>
          <p className="text-muted-foreground mt-1">Manage files, contracts, and extract data automatically.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Folder className="w-4 h-4 mr-2" />
            New Folder
          </Button>
          <UploadZone />
        </div>
      </div>

      <div className="flex items-center justify-between bg-card p-2 rounded-lg border shadow-sm">
        <div className="relative w-full max-w-sm ml-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-8 bg-background border-none focus-visible:ring-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-muted p-1 rounded-md">
          <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setView("list")} className="h-7 text-xs">List</Button>
          <Button variant={view === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setView("grid")} className="h-7 text-xs">Grid</Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-card rounded-lg border">
        {view === "list" ? (
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0">
              <TableRow>
                <TableHead className="w-[40%]">Name</TableHead>
                <TableHead>OCR Status</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocs.map((doc) => (
                <TableRow key={doc.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {getFileIcon(doc.mimeType)}
                      <span className="font-medium">{doc.title || doc.originalName || doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {doc.ocrStatus === "COMPLETED" && <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Processed</Badge>}
                    {doc.ocrStatus === "PENDING" && <Badge variant="outline" className="animate-pulse">Processing</Badge>}
                    {doc.ocrStatus === "NOT_APPLICABLE" && <span className="text-xs text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatSize(doc.size)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(doc.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredDocs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <File className="h-8 w-8 mb-2 opacity-20" />
                      No documents found.
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
            {filteredDocs.map((doc) => (
              <div key={doc.id} className="border rounded-xl p-4 flex flex-col items-center text-center hover:border-primary/50 transition-colors cursor-pointer group bg-background">
                <div className="mb-3 p-4 bg-muted/30 rounded-full group-hover:scale-110 transition-transform">
                  {getFileIcon(doc.mimeType)}
                </div>
                <h3 className="text-sm font-medium line-clamp-2 mb-1 w-full" title={doc.title || doc.originalName || doc.name}>{doc.title || doc.originalName || doc.name}</h3>
                <p className="text-[10px] text-muted-foreground mt-auto">{formatSize(doc.size)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
