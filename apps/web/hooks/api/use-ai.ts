import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export interface AiUsageData {
  totalTokens: number;
  totalRequests: number;
  estimatedCost: number;
  chartData: { date: string; tokens: number }[];
  typeBreakdown: Record<string, number>;
}

export const useAiUsage = () => {
  return useQuery({
    queryKey: ["ai", "usage"],
    queryFn: async (): Promise<AiUsageData> => {
      const res = await api.get("/ai/usage");
      return res.data?.data || res.data;
    },
  });
};
