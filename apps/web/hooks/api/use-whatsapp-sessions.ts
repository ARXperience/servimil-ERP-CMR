import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export const useWhatsAppSessions = () => {
  return useQuery({
    queryKey: ["whatsapp", "sessions"],
    queryFn: async () => {
      const res = await api.get("/whatsapp/sessions");
      return res.data?.data || res.data || [];
    },
  });
};

export const useCreateSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; userId: string }) => {
      const res = await api.post("/whatsapp/sessions", data);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "sessions"] });
    },
  });
};

export const useSessionQR = (sessionId: string | null) => {
  return useQuery({
    queryKey: ["whatsapp", "sessions", sessionId, "qr"],
    queryFn: async () => {
      const res = await api.get(`/whatsapp/sessions/${sessionId}/qr`);
      return res.data?.data || res.data;
    },
    enabled: !!sessionId,
    refetchInterval: 3000, // Poll every 3s for new QR
    retry: false,
  });
};

export const useDisconnectSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await api.post(`/whatsapp/sessions/${sessionId}/disconnect`);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "sessions"] });
    },
  });
};

export const useDeleteSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await api.delete(`/whatsapp/sessions/${sessionId}`);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "sessions"] });
    },
  });
};

// Bot config hooks
export const useBotConfig = () => {
  return useQuery({
    queryKey: ["whatsapp", "bot-config"],
    queryFn: async () => {
      try {
        const [enabledRes, promptRes] = await Promise.all([
          api.get("/admin/system-config").catch(() => ({ data: { data: [] } })),
          api.get("/admin/system-config").catch(() => ({ data: { data: [] } })),
        ]);
        const allConfigs = enabledRes.data?.data || [];
        const enabledConfig = allConfigs.find?.((c: any) => c.key === "whatsapp_bot_enabled");
        const promptConfig = allConfigs.find?.((c: any) => c.key === "whatsapp_bot_prompt");
        return {
          enabled: (enabledConfig?.value as any)?.enabled || false,
          prompt: (promptConfig?.value as any)?.prompt || "",
        };
      } catch {
        return { enabled: false, prompt: "" };
      }
    },
  });
};

export const useUpdateBotConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const res = await api.put(`/admin/system-config/${key}`, { value });
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "bot-config"] });
    },
  });
};

export const useUpdateSessionConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, config }: { sessionId: string; config: any }) => {
      const res = await api.patch(`/whatsapp/sessions/${sessionId}/config`, config);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "sessions"] });
    },
  });
};
