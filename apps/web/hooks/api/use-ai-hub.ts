import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';

interface ChatPayload {
  message: string;
  conversationId?: string;
  audioBase64?: string;
  mimeType?: string;
}

interface ConfirmPayload {
  confirmed: boolean;
}

export function useAiHubConversations() {
  return useQuery({
    queryKey: ['ai-conversations'],
    queryFn: async () => {
      const { data } = await axios.get('/ai-hub/conversations');
      return data.data;
    },
  });
}

export function useAiHubConversation(id?: string) {
  return useQuery({
    queryKey: ['ai-conversation', id],
    queryFn: async () => {
      const { data } = await axios.get(`/ai-hub/conversations/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useAiHubChat() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: ChatPayload) => {
      const { data } = await axios.post('/ai-hub/chat', payload);
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      if (data.conversationId) {
        queryClient.invalidateQueries({ queryKey: ['ai-conversation', data.conversationId] });
      }
    },
  });
}

export function useAiHubConfirmAction(confirmationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ConfirmPayload) => {
      const { data } = await axios.post(`/ai-hub/confirm-action/${confirmationId}`, payload);
      return data.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries if needed
    },
  });
}

export function useAiHubLogs() {
  return useQuery({
    queryKey: ['ai-logs'],
    queryFn: async () => {
      const { data } = await axios.get('/ai-hub/logs');
      return data.data;
    },
  });
}

export function useAiHubSettings() {
  return useQuery({
    queryKey: ['ai-settings'],
    queryFn: async () => {
      const { data } = await axios.get('/ai-hub/settings');
      return data.data;
    },
  });
}

export function useAiHubTools() {
  return useQuery({
    queryKey: ['ai-tools'],
    queryFn: async () => {
      const { data } = await axios.get('/ai-hub/tools');
      return data.data;
    },
  });
}
