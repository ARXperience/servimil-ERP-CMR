import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export interface Document {
  id: string;
  title: string;
  name?: string;
  originalName?: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  createdAt: string;
  uploadedBy: string;
  tags: string[];
  folderId: string | null;
  ocrStatus: "PENDING" | "COMPLETED" | "FAILED" | "NOT_APPLICABLE";
}

export interface OCRData {
  text: string;
  entities: Record<string, string>;
  confidence: number;
}

export const useDocuments = (folderId: string | null = null) => {
  return useQuery({
    queryKey: ["documents", folderId],
    queryFn: async (): Promise<Document[]> => {
      const url = folderId ? `/documents?folderId=${folderId}` : "/documents";
      const res = await api.get(url);
      return res.data?.data || res.data || [];
    },
  });
};

export const useDocumentsByClient = (clientId: string | null) => {
  return useQuery({
    queryKey: ["documents", "client", clientId],
    queryFn: async (): Promise<Document[]> => {
      if (!clientId) return [];
      const res = await api.get(`/documents?clientId=${clientId}`);
      return res.data?.data || res.data || [];
    },
    enabled: !!clientId,
  });
};

export const useDocument = (id: string) => {
  return useQuery({
    queryKey: ["documents", id],
    queryFn: async (): Promise<Document> => {
      const res = await api.get(`/documents/${id}`);
      return res.data?.data || res.data;
    },
    enabled: !!id,
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File): Promise<Document> => {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await api.post("/documents/upload", formData);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
};

export const useOCRData = (documentId: string | null) => {
  return useQuery({
    queryKey: ["documents", "ocr", documentId],
    queryFn: async (): Promise<OCRData> => {
      if (!documentId) return { text: "", entities: {}, confidence: 0 };
      const res = await api.get(`/documents/${documentId}/ocr`);
      return res.data?.data || res.data;
    },
    enabled: !!documentId,
  });
};
