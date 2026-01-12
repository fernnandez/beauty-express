import { ServiceService } from '@domain/services/service.service';
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
import { CreateServiceDto } from '../dtos/service/create-service.dto';
import { UpdateServiceDto } from '../dtos/service/update-service.dto';

@ApiTags('Services')
@Controller('services')
export class ServiceController {
  constructor(private readonly serviceDomainService: ServiceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createDto: CreateServiceDto) {
    return await this.serviceDomainService.createService(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all services' })
  @ApiResponse({ status: 200, description: 'List of services' })
  async findAll(@Query('search') search?: string) {
    return await this.serviceDomainService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a service by ID' })
  @ApiResponse({ status: 200, description: 'Service found' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async findOne(@Param('id') id: string) {
    return await this.serviceDomainService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a service' })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateServiceDto) {
    return await this.serviceDomainService.updateService(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a service' })
  @ApiResponse({ status: 204, description: 'Service deleted successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async remove(@Param('id') id: string) {
    await this.serviceDomainService.delete(id);
  }
}
