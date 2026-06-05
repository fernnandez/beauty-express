import { CreateTenantDto } from '@application/dtos/admin/create-tenant.dto';
import { CreateUserDto } from '@application/dtos/admin/create-user.dto';
import { UpdateTenantDto } from '@application/dtos/admin/update-tenant.dto';
import { UpdateUserDto } from '@application/dtos/admin/update-user.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { SuperAdminGuard } from '@common/guards/super-admin.guard';
import { AdminService } from '@domain/services/admin.service';
import { AccessTokenPayload } from '@domain/services/auth.types';
import {
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
