import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export interface LegalCase {
  id: string;
  title: string;
  description?: string;
  clientId: string;
  client?: any;
  assignedTo?: any;
  assignedToId?: string;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED" | "ON_HOLD";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  courtName?: string;
  caseNumber?: string;
  createdAt: string;
}

export interface LegalEvent {
  id: string;
  caseId: string;
  title: string;
  scheduledAt: string;
  eventType: "HEARING" | "DEADLINE" | "MEETING" | "FILING";
  description: string;
  case?: LegalCase;
}

export const useCases = () => {
  return useQuery({
    queryKey: ["legal", "cases"],
    queryFn: async (): Promise<LegalCase[]> => {
      const res = await api.get("/legal/cases");
      return res.data?.data || [];
    },
  });
};

export const useCase = (id: string) => {
  return useQuery({
    queryKey: ["legal", "cases", id],
    queryFn: async (): Promise<LegalCase> => {
      const res = await api.get(`/legal/cases/${id}`);
      return res.data?.data || res.data;
    },
    enabled: !!id,
  });
};

export const useCreateCase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<LegalCase>): Promise<LegalCase> => {
      const res = await api.post("/legal/cases", data);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal", "cases"] });
    },
  });
};

export const useCaseEvents = (caseId: string) => {
  return useQuery({
    queryKey: ["legal", "events", caseId],
    queryFn: async (): Promise<LegalEvent[]> => {
      const res = await api.get(`/legal/cases/${caseId}/events`);
      return res.data?.data || [];
    },
    enabled: !!caseId,
  });
};

export const useLegalCalendar = () => {
  return useQuery({
    queryKey: ["legal", "calendar"],
    queryFn: async (): Promise<LegalEvent[]> => {
      const res = await api.get("/legal/events");
      return res.data?.data || [];
    },
  });
};

export const useLegalDashboard = () => {
  return useQuery({
    queryKey: ["legal", "dashboard"],
    queryFn: async () => {
      const res = await api.get("/legal/dashboard");
      return res.data?.data || res.data;
    },
  });
};
