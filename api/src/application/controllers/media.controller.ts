import { Public } from '@common/decorators/public.decorator';
import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import {
  MEDIA_STORAGE,
  MediaStorage,
} from '@domain/services/media-storage/media-storage.interface';

/**
 * Serve assets públicos de branding (ex.: logo) sem expor o bucket: gera uma
 * URL assinada (presigned) fresca a cada requisição e redireciona para ela.
 *
 * A `logoUrl` salva aponta para este endpoint (estável), enquanto o objeto no
 * bucket permanece privado. É público porque a logo precisa carregar na tela
 * de login (antes de autenticar) e como favicon.
 */
@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(
    @Inject(MEDIA_STORAGE) private readonly mediaStorage: MediaStorage,
  ) {}

  @Public()
  @Get('branding/*key')
  @ApiOperation({ summary: 'Redireciona para a logo (presigned temporária)' })
  async getBrandingAsset(
    @Param('key') keyParts: string[] | string,
    @Res() res: Response,
  ): Promise<void> {
    // A chave do objeto inclui barras (branding/<tenant>/<arquivo>); o wildcard
    // do Nest entrega os segmentos, que recompomos aqui.
    const rest = Array.isArray(keyParts) ? keyParts.join('/') : keyParts;
    const key = `branding/${rest}`;

    const url = await this.mediaStorage.resolveUrl(key);
    if (!url) {
      throw new NotFoundException('Asset não encontrado');
    }

    // Data URL (dev/inline) não pode ser redirecionada — serve inline.
    if (url.startsWith('data:')) {
      const match = /^data:([^;]+);base64,(.*)$/.exec(url);
      if (!match) throw new NotFoundException('Asset inválido');
      res.setHeader('Content-Type', match[1]);
      res.setHeader('Cache-Control', 'private, max-age=300');
      res.end(Buffer.from(match[2], 'base64'));
      return;
    }

    // Evita cache longo (a presigned expira); o navegador revalida.
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.redirect(302, url);
  }
}
