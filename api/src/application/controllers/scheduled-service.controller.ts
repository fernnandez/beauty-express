import { ScheduledServiceService } from '@domain/services/scheduled-service.service';
import { Body, Controller, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AccessTokenPayload } from '@domain/services/auth.types';
import { UserRole } from '@domain/entities/user-role.enum';
import { CreateScheduledServiceDto } from '../dtos/scheduled-service/create-scheduled-service.dto';
import { UpdateScheduledServiceDto } from '../dtos/scheduled-service/update-scheduled-service.dto';

@ApiTags('Scheduled Services')
@Controller('scheduled-services')
export class ScheduledServiceController {
  constructor(
    private readonly scheduledServiceDomainService: ScheduledServiceService,
  ) {}

  @Post('appointment/:appointmentId')
  @Roles(UserRole.ADMIN)
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
  @Roles(UserRole.ADMIN)
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
  @ApiOperation({
    summary:
      'Complete a scheduled service (admin, or the owning collaborator). ' +
      'Completes the whole appointment when it was the last pending service.',
  })
  @ApiResponse({
    status: 200,
    description: 'Scheduled service completed successfully',
  })
  @ApiResponse({ status: 404, description: 'Scheduled service not found' })
  async complete(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    const scopedCollaboratorId =
      user.role === UserRole.COLLABORATOR ? user.collaboratorId : undefined;
    return await this.scheduledServiceDomainService.completeScheduledService(
      id,
      scopedCollaboratorId,
    );
  }

  @Put(':id/cancel')
  @Roles(UserRole.ADMIN)
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
