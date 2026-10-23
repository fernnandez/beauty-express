import { Injectable } from '@nestjs/common';
import {
  MediaStorage,
  StoreMediaInput,
  StorePublicInput,
} from './media-storage.interface';

/**
 * Armazenamento inline: devolve a mídia como data URL base64.
 * Simples e sem dependências externas — adequado para desenvolvimento.
 * NÃO use em produção: incha o banco e os backups.
 */
@Injectable()
export class InlineMediaStorage implements MediaStorage {
  store(input: StoreMediaInput): Promise<string> {
    return Promise.resolve(`data:${input.mime};base64,${input.base64}`);
  }

  /** O valor persistido já é um data URL servível; retorna como está. */
  resolveUrl(stored: string | null | undefined): Promise<string | null> {
    return Promise.resolve(stored ?? null);
  }

  /** Em dev, o asset público também é embutido como data URL. */
  storePublic(input: StorePublicInput): Promise<string> {
    const base64 = input.buffer.toString('base64');
    return Promise.resolve(`data:${input.mime};base64,${base64}`);
  }
}
