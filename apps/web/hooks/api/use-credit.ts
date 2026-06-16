import {  useQuery, useMutation, useQueryClient  } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export const useCreditKpis = () => {
  return useQuery({
    queryKey: ["credit", "kpis"],
    queryFn: async () => { const res = await api.get("/credit/kpis"); return res.data?.data || res.data; },
  });
};

export const useCreditRequests = (params: any = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ["credit", "requests", params],
    queryFn: async () => { const res = await api.get(`/credit/requests?${queryString}`); return res.data?.data || res.data; },
  });
};

export const useCreateCreditRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/credit/requests", data);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit", "requests"] });
    },
  });
};

export const useCreditPortfolio = (params: any = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ["credit", "portfolio", params],
    queryFn: async () => { const res = await api.get(`/credit/portfolio?${queryString}`); return res.data?.data || res.data; },
  });
};

export const useCreditLoan = (id: string) => {
  return useQuery({
    queryKey: ["credit", "portfolio", id],
    queryFn: async () => { const res = await api.get(`/credit/portfolio/${id}`); return res.data?.data || res.data; },
    enabled: !!id,
  });
};
