import { CreateTenantDto } from '@application/dtos/admin/create-tenant.dto';
import { CreateUserDto } from '@application/dtos/admin/create-user.dto';
import { UpdateTenantDto } from '@application/dtos/admin/update-tenant.dto';
import { SuperAdminGuard } from '@common/guards/super-admin.guard';
import { AdminService } from '@domain/services/admin.service';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(SuperAdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
  async createTenant(@Body() dto: CreateTenantDto) {
    return await this.adminService.createTenant(dto);
  }

  @Patch('tenants/:id')
  @ApiOperation({ summary: 'Atualizar filial' })
  async updateTenant(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return await this.adminService.updateTenant(id, dto);
  }

  @Get('users')
  @ApiOperation({ summary: 'Listar usuários' })
  async listUsers() {
    return await this.adminService.listUsers();
  }

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar usuário operacional' })
  async createUser(@Body() dto: CreateUserDto) {
    return await this.adminService.createUser(dto);
  }
}
