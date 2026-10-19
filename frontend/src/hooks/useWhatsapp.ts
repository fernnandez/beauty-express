import { useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { whatsappService } from "../services/whatsapp.service";
import { authStorage } from "../services/auth-storage";
import { resolveApiBaseUrl } from "../utils/api-url.util";
import type {
  Conversation,
  WhatsappInstanceState,
  WhatsappMessage,
  WhatsappQr,
} from "../types";

const INSTANCE_KEY = ["whatsapp", "instance"];
const CONVERSATIONS_KEY = ["whatsapp", "conversations"];

/** Status da instância; faz polling enquanto não estiver conectada. */
export const useWhatsappInstance = (poll = true) => {
  return useQuery<WhatsappInstanceState>({
    queryKey: INSTANCE_KEY,
    queryFn: () => whatsappService.getInstance(),
    refetchInterval: (query) =>
      poll && query.state.data?.status !== "connected" ? 4000 : false,
  });
};

export const useWhatsappQr = (enabled: boolean) => {
  return useQuery<WhatsappQr>({
    queryKey: ["whatsapp", "qr"],
    queryFn: () => whatsappService.getQr(),
    enabled,
    refetchInterval: enabled ? 20000 : (false as const),
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

/** Lista de conversas; o tempo real vem do socket, polling é só fallback. */
export const useConversations = (enabled = true) => {
  return useQuery<Conversation[]>({
    queryKey: CONVERSATIONS_KEY,
    queryFn: () => whatsappService.listConversations(),
    enabled,
    refetchInterval: enabled ? 20000 : false,
  });
};

/** Mensagens de uma conversa; polling enquanto a conversa está aberta. */
export const useMessages = (conversationId: string | null) => {
  return useQuery<WhatsappMessage[]>({
    queryKey: ["whatsapp", "messages", conversationId],
    queryFn: () => whatsappService.listMessages(conversationId as string),
    enabled: !!conversationId,
    refetchInterval: conversationId ? 15000 : false,
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

export const useImportPriceList = () => {
  return useMutation({
    mutationFn: () => whatsappService.getPriceListPreview(),
  });
};

export const useStartConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) =>
      whatsappService.startConversationWithClient(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });
};

export const useLinkConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      clientId,
    }: {
      conversationId: string;
      clientId: string;
    }) => whatsappService.linkConversationToClient(conversationId, clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });
};

export const useConfirmAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appointmentId: string) =>
      whatsappService.confirmAppointment(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });
};

export const useReactToMessage = (conversationId: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      whatsappService.reactToMessage(messageId, emoji),
    onSuccess: () => {
      if (conversationId) {
        queryClient.invalidateQueries({
          queryKey: ["whatsapp", "messages", conversationId],
        });
      }
    },
  });
};

/**
 * Conecta ao gateway de tempo real do WhatsApp e invalida as queries do inbox
 * quando chega um evento (mensagem nova, status, reação). Retorna se está vivo.
 */
export const useWhatsappSocket = (enabled: boolean) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const token = authStorage.getAccessToken();
    if (!token) return;

    const base = resolveApiBaseUrl();
    const socket: Socket = io(`${base}/whatsapp`, {
      transports: ["websocket"],
      auth: { token },
    });

    const onUpdate = (payload: { conversationId?: string }) => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      if (payload?.conversationId) {
        queryClient.invalidateQueries({
          queryKey: ["whatsapp", "messages", payload.conversationId],
        });
      }
    };

    socket.on("whatsapp:update", onUpdate);

    return () => {
      socket.off("whatsapp:update", onUpdate);
      socket.disconnect();
    };
  }, [enabled, queryClient]);
};
