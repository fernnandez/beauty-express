import { Module } from '@nestjs/common';
import { MediaController } from '@application/controllers/media.controller';
import { mediaStorageProvider } from '@domain/services/media-storage/media-storage.provider';

/** Serve assets de branding (logo) via presigned, mantendo o bucket privado. */
@Module({
  controllers: [MediaController],
  providers: [mediaStorageProvider],
})
export class MediaModule {}
