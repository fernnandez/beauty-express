import { AppointmentService } from '@domain/services/appointment.service';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { validateDateFormat } from '../../common/utils/date-validation.util';
import { parseDateString } from '../../utils/date.util';
import { CreateAppointmentDto } from '../dtos/appointment/create-appointment.dto';
import { UpdateAppointmentDto } from '../dtos/appointment/update-appointment.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AccessTokenPayload } from '@domain/services/auth.types';
import { UserRole } from '@domain/entities/user-role.enum';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentDomainService: AppointmentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({
    status: 201,
    description: 'Appointment created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createDto: CreateAppointmentDto) {
    return await this.appointmentDomainService.createAppointment(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get appointments by date (defaults to today)' })
  @ApiResponse({ status: 200, description: 'List of appointments' })
  async findAll(
    @CurrentUser() user: AccessTokenPayload,
    @Query('date') date?: string,
  ) {
    const scopedCollaboratorId =
      user.role === UserRole.COLLABORATOR ? user.collaboratorId : undefined;

    const dateObj = date
      ? (validateDateFormat(date), parseDateString(date))
      : parseDateString(new Date().toISOString().split('T')[0]);

    return await this.appointmentDomainService.findByDate(
      dateObj,
      scopedCollaboratorId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an appointment by ID' })
  @ApiResponse({ status: 200, description: 'Appointment found' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async findOne(@Param('id') id: string) {
    return await this.appointmentDomainService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an appointment' })
  @ApiResponse({
    status: 200,
    description: 'Appointment updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAppointmentDto,
  ) {
    return await this.appointmentDomainService.updateAppointment(id, updateDto);
  }

  @Put(':id/complete')
  @ApiOperation({ summary: 'Complete an appointment' })
  @ApiResponse({
    status: 200,
    description: 'Appointment completed successfully',
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async complete(@Param('id') id: string) {
    return await this.appointmentDomainService.completeAppointment(id);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel an appointment' })
  @ApiResponse({
    status: 200,
    description: 'Appointment cancelled successfully',
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async cancel(@Param('id') id: string) {
    return await this.appointmentDomainService.cancelAppointment(id);
  }

  @Put(':id/reopen')
  @ApiOperation({ summary: 'Reopen a completed appointment' })
  @ApiResponse({
    status: 200,
    description: 'Appointment reopened successfully',
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({
    status: 400,
    description: 'Appointment cannot be reopened (e.g. paid commissions)',
  })
  async reopen(@Param('id') id: string) {
    return await this.appointmentDomainService.reopenAppointment(id);
  }
}
