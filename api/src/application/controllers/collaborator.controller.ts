import { CollaboratorService } from '@domain/services/collaborator.service';
import { CollaboratorAccessService } from '@domain/services/collaborator-access.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@domain/entities/user-role.enum';
import { CreateCollaboratorDto } from '../dtos/collaborator/create-collaborator.dto';
import { UpdateCollaboratorDto } from '../dtos/collaborator/update-collaborator.dto';
import {
  GrantCollaboratorAccessDto,
  UpdateCollaboratorAccessDto,
} from '../dtos/collaborator/collaborator-access.dto';

@ApiTags('Collaborators')
@Controller('collaborators')
@Roles(UserRole.ADMIN)
export class CollaboratorController {
  constructor(
    private readonly collaboratorDomainService: CollaboratorService,
    private readonly accessService: CollaboratorAccessService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new collaborator' })
  @ApiResponse({
    status: 201,
    description: 'Collaborator created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createDto: CreateCollaboratorDto) {
    return await this.collaboratorDomainService.createCollaborator(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all collaborators' })
  @ApiResponse({ status: 200, description: 'List of collaborators' })
  async findAll(@Query('search') search?: string) {
    return await this.collaboratorDomainService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a collaborator by ID' })
  @ApiResponse({ status: 200, description: 'Collaborator found' })
  @ApiResponse({ status: 404, description: 'Collaborator not found' })
  async findOne(@Param('id') id: string) {
    return await this.collaboratorDomainService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a collaborator' })
  @ApiResponse({
    status: 200,
    description: 'Collaborator updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Collaborator not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCollaboratorDto,
  ) {
    return await this.collaboratorDomainService.updateCollaborator(
      id,
      updateDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a collaborator' })
  @ApiResponse({
    status: 204,
    description: 'Collaborator deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Collaborator not found' })
  async remove(@Param('id') id: string) {
    await this.collaboratorDomainService.delete(id);
  }

  @Get(':id/access')
  @ApiOperation({ summary: 'Status de acesso (login) do colaborador' })
  async getAccess(@Param('id') id: string) {
    return await this.accessService.getStatus(id);
  }

  @Post(':id/access')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Conceder acesso (criar login) ao colaborador' })
  async grantAccess(
    @Param('id') id: string,
    @Body() dto: GrantCollaboratorAccessDto,
  ) {
    return await this.accessService.grant(id, dto);
  }

  @Patch(':id/access')
  @ApiOperation({
    summary: 'Atualizar acesso do colaborador (senha/email/ativo)',
  })
  async updateAccess(
    @Param('id') id: string,
    @Body() dto: UpdateCollaboratorAccessDto,
  ) {
    return await this.accessService.update(id, dto);
  }

  @Delete(':id/access')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revogar acesso do colaborador' })
  async revokeAccess(@Param('id') id: string) {
    await this.accessService.revoke(id);
  }
}
