import { ScheduledServiceService } from '@domain/services/scheduled-service.service';
import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateScheduledServiceDto } from '../dtos/scheduled-service/create-scheduled-service.dto';
import { UpdateScheduledServiceDto } from '../dtos/scheduled-service/update-scheduled-service.dto';

@ApiTags('Scheduled Services')
@Controller('scheduled-services')
export class ScheduledServiceController {
  constructor(
    private readonly scheduledServiceDomainService: ScheduledServiceService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all scheduled services' })
  @ApiResponse({ status: 200, description: 'List of scheduled services' })
  async findAll() {
    return await this.scheduledServiceDomainService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a scheduled service by ID' })
  @ApiResponse({ status: 200, description: 'Scheduled service found' })
  @ApiResponse({ status: 404, description: 'Scheduled service not found' })
  async findOne(@Param('id') id: string) {
    return await this.scheduledServiceDomainService.findById(id);
  }

  @Get('appointment/:appointmentId')
  @ApiOperation({
    summary: 'Get all scheduled services for an appointment',
  })
  @ApiResponse({
    status: 200,
    description: 'List of scheduled services for the appointment',
  })
  async findByAppointmentId(@Param('appointmentId') appointmentId: string) {
    return await this.scheduledServiceDomainService.findByAppointmentId(
      appointmentId,
    );
  }

  @Post('appointment/:appointmentId')
  @ApiOperation({
    summary: 'Create a new scheduled service for an appointment',
  })
  @ApiResponse({
    status: 201,
    description: 'Scheduled service created successfully',
  })
  @ApiResponse({ status: 404, description: 'Appointment or service not found' })
  async create(
    @Param('appointmentId') appointmentId: string,
    @Body() createDto: CreateScheduledServiceDto,
  ) {
    return await this.scheduledServiceDomainService.createScheduledService(
      appointmentId,
      createDto,
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a scheduled service' })
  @ApiResponse({
    status: 200,
    description: 'Scheduled service updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Scheduled service not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateScheduledServiceDto,
  ) {
    return await this.scheduledServiceDomainService.updateScheduledService(id, {
      ...updateDto,
    });
  }

  @Put(':id/complete')
  @ApiOperation({ summary: 'Complete a scheduled service' })
  @ApiResponse({
    status: 200,
    description: 'Scheduled service completed successfully',
  })
  @ApiResponse({ status: 404, description: 'Scheduled service not found' })
  async complete(@Param('id') id: string) {
    return await this.scheduledServiceDomainService.completeScheduledService(
      id,
    );
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel a scheduled service' })
  @ApiResponse({
    status: 200,
    description: 'Scheduled service cancelled successfully',
  })
  @ApiResponse({ status: 404, description: 'Scheduled service not found' })
  async cancel(@Param('id') id: string) {
    return await this.scheduledServiceDomainService.cancelScheduledService(id);
  }
}
