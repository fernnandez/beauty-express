import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommissionService } from '@domain/services/commission.service';
import { endOfDay, parseDateString } from '../../utils/date.util';
import { validateDateFormat } from '../../common/utils/date-validation.util';
import { MarkCommissionsDto } from '../dtos/commission/mark-commissions.dto';
import { CommissionFilterParams } from '@domain/repositories/commission-list.types';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { AccessTokenPayload } from '@domain/services/auth.types';
import { UserRole } from '@domain/entities/user-role.enum';
import { ForbiddenException } from '@nestjs/common';

@ApiTags('Commissions')
@Controller('commissions')
export class CommissionController {
  constructor(private readonly commissionDomainService: CommissionService) {}

  @Get()
  @ApiOperation({ summary: 'Get commissions with optional filters and pagination' })
  @ApiQuery({
    name: 'paid',
    required: false,
    type: Boolean,
    description: 'Filter by payment status (true for paid, false for pending)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for date range filter (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for date range filter (ISO string)',
  })
  @ApiQuery({
    name: 'collaboratorId',
    required: false,
    type: String,
    isArray: true,
    description: 'Filter by one or more collaborator IDs',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by collaborator, service or client name',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 50, max: 100)',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of commissions' })
  async findAll(
    @CurrentUser() user: AccessTokenPayload,
    @Query('paid') paid?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('collaboratorId') collaboratorId?: string | string[],
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: CommissionFilterParams = {};
    const parsedPage = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const parsedLimit = Math.min(
      100,
      Math.max(1, parseInt(limit ?? '50', 10) || 50),
    );

    if (paid !== undefined) {
      filters.paid = paid === 'true';
    }

    if (startDate) {
      validateDateFormat(startDate);
      filters.startDate = parseDateString(startDate);
    }

    if (endDate) {
      validateDateFormat(endDate);
      filters.endDate = endOfDay(endDate);
    }

    if (collaboratorId) {
      filters.collaboratorIds = Array.isArray(collaboratorId)
        ? collaboratorId
        : [collaboratorId];
    }

    // Escopo: colaborador só enxerga as próprias comissões.
    if (user.role === UserRole.COLLABORATOR) {
      filters.collaboratorIds = user.collaboratorId
        ? [user.collaboratorId]
        : ['__none__'];
    }

    const trimmedSearch = search?.trim();
    if (trimmedSearch) {
      filters.search = trimmedSearch;
    }

    return await this.commissionDomainService.findAll(
      Object.keys(filters).length > 0 ? filters : undefined,
      parsedPage,
      parsedLimit,
    );
  }

  @Get('alerts')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Alertas de comissões não pagas por colaborador (atraso/pendência)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Lista por colaborador com status (overdue/pending/ok) e valores atrasados/pendentes',
  })
  async getCollaboratorAlerts() {
    return await this.commissionDomainService.getCollaboratorAlerts();
  }

  @Get('collaborator/:collaboratorId/summary')
  @ApiOperation({
    summary: 'Get commission summary for a single collaborator',
  })
  @ApiParam({ name: 'collaboratorId', type: String })
  @ApiQuery({ name: 'paid', required: false, type: Boolean })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description:
      'Aggregated summary: services count, commission totals and unique clients',
  })
  async getCollaboratorSummary(
    @Param('collaboratorId') collaboratorId: string,
    @CurrentUser() user: AccessTokenPayload,
    @Query('paid') paid?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    // Escopo: colaborador só pode consultar o próprio resumo.
    if (
      user.role === UserRole.COLLABORATOR &&
      collaboratorId !== user.collaboratorId
    ) {
      throw new ForbiddenException('Acesso negado');
    }

    const filters: CommissionFilterParams = {};

    if (paid !== undefined) {
      filters.paid = paid === 'true';
    }

    if (startDate) {
      validateDateFormat(startDate);
      filters.startDate = parseDateString(startDate);
    }

    if (endDate) {
      validateDateFormat(endDate);
      filters.endDate = endOfDay(endDate);
    }

    const trimmedSearch = search?.trim();
    if (trimmedSearch) {
      filters.search = trimmedSearch;
    }

    return await this.commissionDomainService.getCollaboratorSummary(
      collaboratorId,
      filters,
    );
  }

  @Put('mark-as-paid')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark multiple commissions as paid' })
  @ApiResponse({
    status: 200,
    description: 'Commissions marked as paid successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid commission IDs' })
  async markAsPaid(@Body() markDto: MarkCommissionsDto) {
    return await this.commissionDomainService.markAsPaid(markDto.commissionIds);
  }

  @Put('mark-as-unpaid')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark multiple commissions as unpaid' })
  @ApiResponse({
    status: 200,
    description: 'Commissions marked as unpaid successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid commission IDs' })
  async markAsUnpaid(@Body() markDto: MarkCommissionsDto) {
    return await this.commissionDomainService.markAsUnpaid(
      markDto.commissionIds,
    );
  }
}
