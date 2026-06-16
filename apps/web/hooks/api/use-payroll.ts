import {  useQuery, useMutation, useQueryClient  } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export const usePayrollKpis = () => {
  return useQuery({
    queryKey: ["payroll", "kpis"],
    queryFn: async () => { const res = await api.get("/payroll/kpis"); return res.data?.data || res.data; },
  });
};

export const useEmployees = (params: any = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ["payroll", "employees", params],
    queryFn: async () => { const res = await api.get(`/payroll/employees?${queryString}`); return res.data?.data || res.data; },
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/payroll/employees", data);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "employees"] });
    },
  });
};

export const usePayrollRuns = (params: any = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ["payroll", "runs", params],
    queryFn: async () => { const res = await api.get(`/payroll/runs?${queryString}`); return res.data?.data || res.data; },
  });
};

export const usePayrollRun = (id: string) => {
  return useQuery({
    queryKey: ["payroll", "runs", id],
    queryFn: async () => { const res = await api.get(`/payroll/runs/${id}`); return res.data?.data || res.data; },
    enabled: !!id,
  });
};

export const useDepartments = () => {
  return useQuery({
    queryKey: ["payroll", "departments"],
    queryFn: async () => { const res = await api.get("/payroll/departments"); return res.data?.data || res.data; },
  });
};

export const usePositions = () => {
  return useQuery({
    queryKey: ["payroll", "positions"],
    queryFn: async () => { const res = await api.get("/payroll/positions"); return res.data?.data || res.data; },
  });
};
