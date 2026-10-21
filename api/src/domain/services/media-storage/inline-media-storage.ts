import { Injectable } from '@nestjs/common';
import { MediaStorage, StoreMediaInput } from './media-storage.interface';

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
}
