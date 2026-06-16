import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export const useFinanceKpis = () => {
  return useQuery({
    queryKey: ["finance", "kpis"],
    queryFn: async () => {
      const res = await api.get("/finance/kpis");
      return res.data?.data || res.data;
    },
  });
};

export const useRevenueData = () => {
  return useQuery({
    queryKey: ["finance", "revenue"],
    queryFn: async () => {
      const res = await api.get("/finance/revenue");
      return res.data?.data || res.data;
    },
  });
};

export const useRecentTransactions = () => {
  return useQuery({
    queryKey: ["finance", "transactions", "recent"],
    queryFn: async () => {
      const res = await api.get("/finance/transactions/recent");
      return res.data?.data || res.data;
    },
  });
};

export const useTransactions = (params: any = {}) => {
  return useQuery({
    queryKey: ["finance", "transactions", params],
    queryFn: async () => {
      const res = await api.get("/finance/transactions", { params });
      return res.data?.data || res.data;
    },
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/finance/transactions", data);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "transactions"] });
      queryClient.invalidateQueries({ queryKey: ["finance", "kpis"] });
    },
  });
};

export const useCashFlow = () => {
  return useQuery({
    queryKey: ["finance", "cash-flow"],
    queryFn: async () => {
      const res = await api.get("/finance/cash-flow");
      return res.data?.data || res.data;
    },
  });
};

export const useAccounts = () => {
  return useQuery({
    queryKey: ["finance", "accounts"],
    queryFn: async () => {
      const res = await api.get("/finance/accounts");
      return res.data?.data || res.data;
    },
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["finance", "categories"],
    queryFn: async () => {
      const res = await api.get("/finance/categories");
      return res.data?.data || res.data;
    },
  });
};
