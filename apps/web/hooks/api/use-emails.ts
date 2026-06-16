import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export const useEmails = (filters?: { importantOnly?: boolean; limit?: number }) => {
  return useQuery({
    queryKey: ["emails", filters],
    queryFn: async () => {
      const res = await api.get("/email-integration", { params: filters });
      return res.data?.data || res.data || [];
    },
  });
};
