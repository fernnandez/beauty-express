import { api } from "../config/api";
import type {
  Conversation,
  WhatsappInstanceState,
  WhatsappMessage,
  WhatsappQr,
} from "../types";

export const whatsappService = {
  getInstance: async (): Promise<WhatsappInstanceState> => {
    const response = await api.get<WhatsappInstanceState>("/whatsapp/instance");
    return response.data;
  },

  createInstance: async (): Promise<WhatsappInstanceState> => {
    const response = await api.post<WhatsappInstanceState>(
      "/whatsapp/instance",
    );
    return response.data;
  },

  getQr: async (): Promise<WhatsappQr> => {
    const response = await api.get<WhatsappQr>("/whatsapp/instance/qr");
    return response.data;
  },

  disconnect: async (): Promise<WhatsappInstanceState> => {
    const response = await api.post<WhatsappInstanceState>(
      "/whatsapp/instance/disconnect",
    );
    return response.data;
  },

  listConversations: async (): Promise<Conversation[]> => {
    const response = await api.get<Conversation[]>("/whatsapp/conversations");
    return response.data;
  },

  listMessages: async (conversationId: string): Promise<WhatsappMessage[]> => {
    const response = await api.get<WhatsappMessage[]>(
      `/whatsapp/conversations/${conversationId}/messages`,
    );
    return response.data;
  },

  sendMessage: async (
    conversationId: string,
    text: string,
  ): Promise<WhatsappMessage> => {
    const response = await api.post<WhatsappMessage>(
      `/whatsapp/conversations/${conversationId}/messages`,
      { text },
    );
    return response.data;
  },

  markRead: async (conversationId: string): Promise<void> => {
    await api.post(`/whatsapp/conversations/${conversationId}/read`);
  },
};
