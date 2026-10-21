import { useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { whatsappService } from "../services/whatsapp.service";
import { authStorage } from "../services/auth-storage";
import { resolveApiBaseUrl } from "../utils/api-url.util";
import {
  setWhatsappSocketConnected,
  useWhatsappSocketConnected,
} from "./whatsapp-socket-state";
import type {
  Conversation,
  WhatsappInstanceState,
  WhatsappMessage,
  WhatsappQr,
} from "../types";

const INSTANCE_KEY = ["whatsapp", "instance"];
const CONVERSATIONS_KEY = ["whatsapp", "conversations"];
const UNREAD_KEY = ["whatsapp", "unread-count"];

/**
 * Intervalos de polling. Com o socket vivo, pollamos raramente (apenas como
 * rede de segurança contra eventos perdidos); sem socket, pollamos com mais
 * frequência para manter o inbox atualizado.
 */
const POLL = {
  conversations: { live: 60000, fallback: 15000 },
  messages: { live: 45000, fallback: 10000 },
  unread: { live: 90000, fallback: 30000 },
} as const;

/** Total de conversas com mensagens não lidas (badge na sidebar). */
export const useWhatsappUnreadCount = (enabled = true) => {
  const socketLive = useWhatsappSocketConnected();
  return useQuery<{ count: number }>({
    queryKey: UNREAD_KEY,
    queryFn: () => whatsappService.getUnreadCount(),
    enabled,
    refetchInterval: enabled
      ? socketLive
        ? POLL.unread.live
        : POLL.unread.fallback
      : false,
  });
};

/** Status da instância; polling rápido enquanto conecta, leve quando conectada. */
export const useWhatsappInstance = (poll = true) => {
  return useQuery<WhatsappInstanceState>({
    queryKey: INSTANCE_KEY,
    queryFn: () => whatsappService.getInstance(),
    refetchInterval: (query) => {
      if (!poll) return false;
      // Enquanto não está conectada, poll rápido (parear/reconectar).
      // Já conectada, mantém um poll leve como rede de segurança contra
      // quedas que o socket possa não entregar.
      return query.state.data?.status === "connected" ? 30000 : 4000;
    },
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
  const socketLive = useWhatsappSocketConnected();
  return useQuery<Conversation[]>({
    queryKey: CONVERSATIONS_KEY,
    queryFn: () => whatsappService.listConversations(),
    enabled,
    refetchInterval: enabled
      ? socketLive
        ? POLL.conversations.live
        : POLL.conversations.fallback
      : false,
  });
};

/** Mensagens de uma conversa; polling enquanto a conversa está aberta. */
export const useMessages = (conversationId: string | null) => {
  const socketLive = useWhatsappSocketConnected();
  return useQuery<WhatsappMessage[]>({
    queryKey: ["whatsapp", "messages", conversationId],
    queryFn: () => whatsappService.listMessages(conversationId as string),
    enabled: !!conversationId,
    refetchInterval: conversationId
      ? socketLive
        ? POLL.messages.live
        : POLL.messages.fallback
      : false,
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
      queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
    },
  });
};

export const useSendMedia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      payload,
    }: {
      conversationId: string;
      payload: {
        base64: string;
        mime: string;
        type: "image" | "audio" | "video" | "document";
        fileName?: string;
        caption?: string;
      };
    }) => whatsappService.sendMedia(conversationId, payload),
    onSuccess: (_data, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      queryClient.invalidateQueries({
        queryKey: ["whatsapp", "messages", conversationId],
      });
    },
  });
};

export const useSyncConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      whatsappService.syncConversation(conversationId),
    onSuccess: (_data, conversationId) => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      queryClient.invalidateQueries({
        queryKey: ["whatsapp", "messages", conversationId],
      });
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

    const onConnect = () => setWhatsappSocketConnected(true);
    const onDisconnect = () => setWhatsappSocketConnected(false);

    const onUpdate = (payload: { conversationId?: string }) => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
      if (payload?.conversationId) {
        queryClient.invalidateQueries({
          queryKey: ["whatsapp", "messages", payload.conversationId],
        });
      }
    };

    // Mudança de estado da conexão (conectou / caiu / logout pelo celular):
    // atualiza o status da instância na hora.
    const onConnection = () => {
      queryClient.invalidateQueries({ queryKey: INSTANCE_KEY });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("whatsapp:update", onUpdate);
    socket.on("whatsapp:connection", onConnection);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("whatsapp:update", onUpdate);
      socket.off("whatsapp:connection", onConnection);
      socket.disconnect();
      setWhatsappSocketConnected(false);
    };
  }, [enabled, queryClient]);
};
