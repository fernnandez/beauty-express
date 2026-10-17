import { CreateTenantDto } from '@application/dtos/admin/create-tenant.dto';
import { CreateUserDto } from '@application/dtos/admin/create-user.dto';
import { UpdateTenantDto } from '@application/dtos/admin/update-tenant.dto';
import { UpdateUserDto } from '@application/dtos/admin/update-user.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { SuperAdminGuard } from '@common/guards/super-admin.guard';
import { AdminService } from '@domain/services/admin.service';
import { AccessTokenPayload } from '@domain/services/auth.types';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { DateTime } from 'luxon';
import { VALIDATION_CONSTANTS } from '../../common/constants/validation.constants';
import { validateDateFormat } from '../../common/utils/date-validation.util';
import { endOfDay, parseDateString } from '../../utils/date.util';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(SuperAdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private auditContext(user: AccessTokenPayload, req: Request) {
    return {
      actorUserId: user.sub,
      ipAddress: req.ip,
    };
  }

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Estatísticas consolidadas do backoffice' })
  async dashboardStats() {
    return await this.adminService.getDashboardStats();
  }

  @Get('tenants')
  @ApiOperation({ summary: 'Listar filiais' })
  async listTenants() {
    return await this.adminService.listTenants();
  }

  @Post('tenants')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar filial' })
  async createTenant(
    @Body() dto: CreateTenantDto,
    @CurrentUser() user: AccessTokenPayload,
    @Req() req: Request,
  ) {
    return await this.adminService.createTenant(
      dto,
      this.auditContext(user, req),
    );
  }

  @Patch('tenants/:id')
  @ApiOperation({ summary: 'Atualizar filial' })
  async updateTenant(
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() user: AccessTokenPayload,
    @Req() req: Request,
  ) {
    return await this.adminService.updateTenant(
      id,
      dto,
      this.auditContext(user, req),
    );
  }

  @Get('tenants/:id')
  @ApiOperation({ summary: 'Detalhe da filial com métricas' })
  async getTenantDetail(@Param('id') id: string) {
    return await this.adminService.getTenantDetail(id);
  }

  @Get('tenants/:id/appointments')
  @ApiOperation({ summary: 'Agendamentos de uma filial' })
  @ApiQuery({ name: 'date', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getTenantAppointments(
    @Param('id') id: string,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (date) {
      validateDateFormat(date);
    }
    if (startDate) {
      validateDateFormat(startDate);
    }
    if (endDate) {
      validateDateFormat(endDate);
    }

    return await this.adminService.getTenantAppointments(id, {
      date,
      startDate,
      endDate,
    });
  }

  @Get('tenants/:id/commissions')
  @ApiOperation({ summary: 'Comissões de uma filial' })
  @ApiQuery({ name: 'paid', required: false, type: Boolean })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'collaboratorId', required: false, type: String })
  async getTenantCommissions(
    @Param('id') id: string,
    @Query('paid') paid?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('collaboratorId') collaboratorId?: string,
  ) {
    const filters: {
      paid?: boolean;
      startDate?: Date;
      endDate?: Date;
      collaboratorId?: string;
    } = {};

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
      filters.collaboratorId = collaboratorId;
    }

    return await this.adminService.getTenantCommissions(id, filters);
  }

  @Get('tenants/:id/summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resumo financeiro mensal de uma filial' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'month', required: false, type: Number })
  async getTenantSummary(
    @Param('id') id: string,
    @Query('year') yearParam?: string,
    @Query('month') monthParam?: string,
  ) {
    const now = DateTime.now().setZone('America/Sao_Paulo');
    const year = yearParam ? parseInt(yearParam, 10) : now.year;
    const month = monthParam ? parseInt(monthParam, 10) : now.month;

    if (Number.isNaN(year) || Number.isNaN(month)) {
      throw new BadRequestException('Ano ou mês inválido');
    }

    if (
      month < VALIDATION_CONSTANTS.MONTH.MIN ||
      month > VALIDATION_CONSTANTS.MONTH.MAX
    ) {
      throw new BadRequestException(VALIDATION_CONSTANTS.MONTH.MESSAGE);
    }

    if (
      year < VALIDATION_CONSTANTS.YEAR.MIN ||
      year > VALIDATION_CONSTANTS.YEAR.MAX
    ) {
      throw new BadRequestException(VALIDATION_CONSTANTS.YEAR.MESSAGE);
    }

    return await this.adminService.getTenantSummary(id, year, month);
  }

  @Get('users')
  @ApiOperation({ summary: 'Listar usuários' })
  async listUsers() {
    return await this.adminService.listUsers();
  }

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar usuário operacional' })
  async createUser(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: AccessTokenPayload,
    @Req() req: Request,
  ) {
    return await this.adminService.createUser(
      dto,
      this.auditContext(user, req),
    );
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Atualizar usuário' })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AccessTokenPayload,
    @Req() req: Request,
  ) {
    return await this.adminService.updateUser(
      id,
      dto,
      this.auditContext(user, req),
    );
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Listar ações recentes do backoffice' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listAuditLogs(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return await this.adminService.listAuditLogs(
      Number.isNaN(parsedLimit) ? 50 : parsedLimit,
    );
  }
}
