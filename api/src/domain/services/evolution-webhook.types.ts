/**
 * Formato (parcial) do payload de webhook da Evolution API.
 * Modelamos apenas o que consumimos; o restante é ignorado.
 */
export interface EvolutionWebhookPayload {
  /** Nome da instância que originou o evento (resolve o tenant). */
  instance?: string;
  /** Tipo do evento, ex.: 'messages.upsert', 'connection.update'. */
  event?: string;
  data?: EvolutionWebhookData;
}

export interface EvolutionWebhookData {
  key?: {
    /** ex.: 5581999999999@s.whatsapp.net */
    remoteJid?: string;
    /** true quando a mensagem foi enviada por nós (eco). */
    fromMe?: boolean;
    /** ID da mensagem no WhatsApp (dedupe). */
    id?: string;
  };
  /** Estado da conexão (evento connection.update): 'open' | 'close' | 'connecting'. */
  state?: string;
  /** Status de entrega (evento messages.update): ex. DELIVERY_ACK, READ, SERVER_ACK. */
  status?: string;
  /** ID da mensagem no evento messages.update (payload achatado da Evolution). */
  keyId?: string;
  /** Nome exibido do contato. */
  pushName?: string;
  /** Timestamp em segundos (epoch). */
  messageTimestamp?: number | string;
  message?: {
    conversation?: string;
    extendedTextMessage?: { text?: string };
    imageMessage?: { caption?: string; url?: string };
    stickerMessage?: { url?: string; mimetype?: string };
    audioMessage?: { url?: string };
    videoMessage?: { caption?: string; url?: string };
    documentMessage?: { fileName?: string; url?: string };
    reactionMessage?: {
      key?: { id?: string; fromMe?: boolean; remoteJid?: string };
      text?: string;
    };
  };
}
