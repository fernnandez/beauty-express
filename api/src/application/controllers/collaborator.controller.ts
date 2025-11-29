import { CollaboratorService } from '@domain/services/collaborator.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateCollaboratorDto } from '../dtos/collaborator/create-collaborator.dto';
import { UpdateCollaboratorDto } from '../dtos/collaborator/update-collaborator.dto';

@ApiTags('Collaborators')
@Controller('collaborators')
export class CollaboratorController {
  constructor(
    private readonly collaboratorDomainService: CollaboratorService,
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
    return await this.collaboratorDomainService.createCollaborator({
      ...createDto,
    });
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
    return await this.collaboratorDomainService.updateCollaborator(id, {
      ...updateDto,
    });
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
}
