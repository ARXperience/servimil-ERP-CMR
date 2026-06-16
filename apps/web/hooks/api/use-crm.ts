import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST";

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: LeadStatus;
  value: number;
  assignedTo?: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  type: "CALL" | "MEETING" | "EMAIL" | "TASK";
  title: string;
  description: string;
  dueDate: string;
  status: "PENDING" | "COMPLETED";
  leadId?: string;
}

export const useLeads = () => {
  return useQuery({
    queryKey: ["crm", "leads"],
    queryFn: async (): Promise<Lead[]> => {
      const res = await api.get("/crm/leads");
      return res.data?.data || [];
    },
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Lead>): Promise<Lead> => {
      const res = await api.post("/crm/leads", data);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm", "leads"] });
    },
  });
};

export const useUpdateLeadStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeadStatus }): Promise<Lead> => {
      const res = await api.patch(`/crm/leads/${id}/status`, { status });
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm", "leads"] });
    },
  });
};

export const useActivities = () => {
  return useQuery({
    queryKey: ["crm", "activities"],
    queryFn: async (): Promise<Activity[]> => {
      const res = await api.get("/crm/activities");
      return res.data?.data || [];
    },
  });
};
