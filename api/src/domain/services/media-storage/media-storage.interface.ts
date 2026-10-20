/**
 * Abstração de armazenamento de mídia das mensagens de WhatsApp.
 *
 * Implementações:
 * - InlineMediaStorage: embute a mídia como data URL base64 (dev; não escala).
 * - S3MediaStorage: envia para um bucket S3-compatível (ex.: Railway/MinIO) e
 *   persiste apenas a URL. É o modo recomendado para produção.
 */
export interface StoreMediaInput {
  /** Conteúdo bruto da mídia em base64 (sem o prefixo `data:`). */
  base64: string;
  /** MIME type (ex.: image/webp, image/jpeg). */
  mime: string;
  /** Tenant dono da mídia — usado para particionar o caminho no bucket. */
  tenantId: string;
  /** Identificador da mensagem (compõe a chave do objeto). */
  waMessageId: string;
}

export interface MediaStorage {
  /**
   * Persiste a mídia e retorna o valor a ser gravado em `message.mediaUrl`
   * (um data URL em dev, ou a URL pública/chave no S3 em produção).
   */
  store(input: StoreMediaInput): Promise<string>;
}

/** Token de injeção do NestJS para a MediaStorage. */
export const MEDIA_STORAGE = Symbol('MEDIA_STORAGE');
