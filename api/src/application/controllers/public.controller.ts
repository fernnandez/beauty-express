import { Public } from '@common/decorators/public.decorator';
import { PortalService } from '@domain/services/portal.service';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(private readonly portalService: PortalService) {}

  @Public()
  @Get('portals/resolve')
  @ApiOperation({ summary: 'Resolver portal pelo host (branding do login)' })
  @ApiQuery({ name: 'host', required: true, example: 'mariaborboleta.fernnandez.com' })
  async resolvePortal(@Query('host') host: string) {
    return await this.portalService.resolveByHost(host);
  }

  @Public()
  @Get('portals')
  @ApiOperation({ summary: 'Listar portais ativos (seletor de login em dev)' })
  async listPortals() {
    return await this.portalService.listActivePortals();
  }
}
