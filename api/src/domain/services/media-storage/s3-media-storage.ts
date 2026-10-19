import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  PutObjectCommand,
  PutBucketLifecycleConfigurationCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { MediaStorage, StoreMediaInput } from './media-storage.interface';

const MIME_EXTENSIONS: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'application/pdf': 'pdf',
};

/** Prefixo base de todas as mídias de WhatsApp no bucket. */
const BASE_PREFIX = 'whatsapp';

/**
 * Armazenamento em bucket S3-compatível (Railway/MinIO/AWS S3).
 *
 * Config via env:
 * - S3_BUCKET            (obrigatório)
 * - S3_REGION            (default: us-east-1)
 * - S3_ENDPOINT          (ex.: https://bucket.railway.app — para S3-compatíveis)
 * - S3_ACCESS_KEY_ID     (obrigatório)
 * - S3_SECRET_ACCESS_KEY (obrigatório)
 * - S3_FORCE_PATH_STYLE  ('true' para MinIO/Railway; default true se houver endpoint)
 * - S3_PUBLIC_URL        (base pública para montar a URL do objeto; opcional)
 * - MEDIA_TTL_DAYS       (se setado, aplica lifecycle de expiração no bucket)
 */
@Injectable()
export class S3MediaStorage implements MediaStorage, OnModuleInit {
  private readonly logger = new Logger(S3MediaStorage.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl?: string;
  private readonly endpoint?: string;

  constructor() {
    this.bucket = requireEnv('S3_BUCKET');
    this.endpoint = process.env.S3_ENDPOINT;
    this.publicUrl = process.env.S3_PUBLIC_URL;
    const forcePathStyle =
      (process.env.S3_FORCE_PATH_STYLE ??
        (this.endpoint ? 'true' : 'false')) === 'true';

    this.client = new S3Client({
      region: process.env.S3_REGION || 'us-east-1',
      endpoint: this.endpoint,
      forcePathStyle,
      credentials: {
        accessKeyId: requireEnv('S3_ACCESS_KEY_ID'),
        secretAccessKey: requireEnv('S3_SECRET_ACCESS_KEY'),
      },
    });
  }

  /** Aplica o lifecycle de expiração (TTL) no boot, se configurado. */
  async onModuleInit(): Promise<void> {
    const ttlDays = Number(process.env.MEDIA_TTL_DAYS);
    if (!Number.isFinite(ttlDays) || ttlDays <= 0) return;

    try {
      await this.client.send(
        new PutBucketLifecycleConfigurationCommand({
          Bucket: this.bucket,
          LifecycleConfiguration: {
            Rules: [
              {
                ID: `whatsapp-media-ttl-${ttlDays}d`,
                Status: 'Enabled',
                Filter: { Prefix: `${BASE_PREFIX}/` },
                Expiration: { Days: ttlDays },
              },
            ],
          },
        }),
      );
      this.logger.log(
        `Lifecycle de mídia aplicado: expira ${BASE_PREFIX}/* em ${ttlDays} dias`,
      );
    } catch (err) {
      // Alguns provedores S3-compatíveis não suportam lifecycle via API.
      this.logger.warn(
        `Não foi possível aplicar lifecycle/TTL no bucket (configure manualmente): ${String(err)}`,
      );
    }
  }

  async store(input: StoreMediaInput): Promise<string> {
    const ext = MIME_EXTENSIONS[input.mime] ?? 'bin';
    const datePart = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const key = `${BASE_PREFIX}/${input.tenantId}/${datePart}/${input.waMessageId}.${ext}`;
    const body = Buffer.from(input.base64, 'base64');

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: input.mime,
      }),
    );

    return this.buildUrl(key);
  }

  private buildUrl(key: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl.replace(/\/$/, '')}/${key}`;
    }
    if (this.endpoint) {
      return `${this.endpoint.replace(/\/$/, '')}/${this.bucket}/${key}`;
    }
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} é obrigatória para o storage de mídia S3`);
  }
  return value;
}
