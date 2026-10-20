/** Direção da mensagem no inbox. */
export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

/** Tipo de conteúdo da mensagem. */
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  DOCUMENT = 'document',
  STICKER = 'sticker',
  LOCATION = 'location',
  CONTACT = 'contact',
  UNKNOWN = 'unknown',
}

/** Status de entrega de uma mensagem enviada. */
export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

/** Status de uma conversa no inbox. */
export enum ConversationStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

/** Status de conexão de uma instância da Evolution. */
export enum WhatsappInstanceStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
}
