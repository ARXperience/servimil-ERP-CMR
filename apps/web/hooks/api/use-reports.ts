import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { toast } from "@/components/ui/use-toast";

export const useReportsDashboard = () => {
  return useQuery({
    queryKey: ["reports", "dashboard"],
    queryFn: async () => {
      const res = await api.get("/reports/general-dashboard");
      return res.data?.data || res.data;
    },
  });
};

export const useImportData = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: { type: 'link' | 'csv'; content: string }) => {
      const res = await api.post("/reports/import-data", payload);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Importación Exitosa", description: data.message });
        queryClient.invalidateQueries({ queryKey: ["reports"] });
      } else {
        toast({ title: "Error en importación", description: data.message, variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Ocurrió un error al procesar la información.", variant: "destructive" });
    }
  });
};
