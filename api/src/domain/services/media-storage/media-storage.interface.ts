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
   * Persiste a mídia e retorna o valor a ser gravado em `message.mediaUrl`.
   * - InlineMediaStorage: um data URL base64 (dev).
   * - S3MediaStorage: a *chave* do objeto no bucket (prod).
   */
  store(input: StoreMediaInput): Promise<string>;

  /**
   * Converte o valor persistido numa URL servível ao cliente.
   * - InlineMediaStorage: retorna o próprio data URL.
   * - S3MediaStorage: gera uma URL assinada (presigned GET) temporária,
   *   pois o bucket é privado.
   */
  resolveUrl(stored: string | null | undefined): Promise<string | null>;

  /**
   * Persiste um asset PÚBLICO e estável (ex.: logo de branding) e retorna uma
   * URL diretamente servível, sem presigned/expiração.
   * - InlineMediaStorage: data URL base64 (dev).
   * - S3MediaStorage: URL pública montada a partir de S3_PUBLIC_URL/endpoint.
   */
  storePublic(input: StorePublicInput): Promise<string>;
}

export interface StorePublicInput {
  /** Conteúdo bruto do arquivo. */
  buffer: Buffer;
  /** MIME type (ex.: image/png, image/webp, image/svg+xml). */
  mime: string;
  /** Prefixo lógico no bucket (ex.: 'branding'). */
  prefix: string;
  /** Tenant dono do asset — particiona o caminho. */
  tenantId: string;
}

/** Token de injeção do NestJS para a MediaStorage. */
export const MEDIA_STORAGE = Symbol('MEDIA_STORAGE');
