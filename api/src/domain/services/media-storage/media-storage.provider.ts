import { Logger, Provider } from '@nestjs/common';
import { MEDIA_STORAGE } from './media-storage.interface';
import { InlineMediaStorage } from './inline-media-storage';
import { S3MediaStorage } from './s3-media-storage';

/**
 * Seleciona a implementação de MediaStorage por env:
 * - MEDIA_STORAGE_DRIVER=s3     → S3MediaStorage
 * - qualquer outro valor/ausente → InlineMediaStorage (base64, dev)
 *
 * Em produção, recomenda-se MEDIA_STORAGE_DRIVER=s3.
 */
export const mediaStorageProvider: Provider = {
  provide: MEDIA_STORAGE,
  useFactory: () => {
    const logger = new Logger('MediaStorage');
    const driver = (process.env.MEDIA_STORAGE_DRIVER ?? 'inline').toLowerCase();

    if (driver === 's3') {
      logger.log('Usando storage de mídia: S3');
      return new S3MediaStorage();
    }

    if (process.env.NODE_ENV === 'production') {
      logger.warn(
        'MEDIA_STORAGE_DRIVER não é "s3" em produção — mídia será embutida como base64 (não recomendado)',
      );
    }
    logger.log('Usando storage de mídia: inline (base64)');
    return new InlineMediaStorage();
  },
};
