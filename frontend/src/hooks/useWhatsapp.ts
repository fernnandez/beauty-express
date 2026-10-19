import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { whatsappService } from "../services/whatsapp.service";

const INSTANCE_KEY = ["whatsapp", "instance"];
const CONVERSATIONS_KEY = ["whatsapp", "conversations"];

/** Status da instância; faz polling enquanto não estiver conectada. */
export const useWhatsappInstance = (poll = true) => {
  return useQuery({
    queryKey: INSTANCE_KEY,
    queryFn: () => whatsappService.getInstance(),
    refetchInterval: (query) =>
      poll && query.state.data?.status !== "connected" ? 4000 : false,
  });
};

export const useWhatsappQr = (enabled: boolean) => {
  return useQuery({
    queryKey: ["whatsapp", "qr"],
    queryFn: () => whatsappService.getQr(),
    enabled,
    refetchInterval: enabled ? 20000 : false,
  });
};

export const useCreateWhatsappInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => whatsappService.createInstance(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INSTANCE_KEY });
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "qr"] });
    },
  });
};

export const useDisconnectWhatsapp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => whatsappService.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INSTANCE_KEY });
    },
  });
};

/** Lista de conversas; polling leve para refletir mensagens novas. */
export const useConversations = (enabled = true) => {
  return useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: () => whatsappService.listConversations(),
    enabled,
    refetchInterval: enabled ? 5000 : false,
  });
};

/** Mensagens de uma conversa; polling enquanto a conversa está aberta. */
export const useMessages = (conversationId: string | null) => {
  return useQuery({
    queryKey: ["whatsapp", "messages", conversationId],
    queryFn: () => whatsappService.listMessages(conversationId as string),
    enabled: !!conversationId,
    refetchInterval: conversationId ? 4000 : false,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      text,
    }: {
      conversationId: string;
      text: string;
    }) => whatsappService.sendMessage(conversationId, text),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["whatsapp", "messages", variables.conversationId],
      });
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });
};

export const useMarkConversationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      whatsappService.markRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });
};
