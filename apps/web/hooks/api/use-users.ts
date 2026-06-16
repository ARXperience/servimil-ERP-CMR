import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get("/users");
      // The backend returns [total, items] array for users endpoint
      return res.data?.data?.[1] || [];
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/users", data);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
