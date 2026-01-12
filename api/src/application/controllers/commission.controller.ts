import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommissionService } from '@domain/services/commission.service';
import { endOfDay, parseDateString } from '../../utils/date.util';
import { validateDateFormat } from '../../common/utils/date-validation.util';
import { MarkCommissionsDto } from '../dtos/commission/mark-commissions.dto';

@ApiTags('Commissions')
@Controller('commissions')
export class CommissionController {
  constructor(private readonly commissionDomainService: CommissionService) {}

  @Post('calculate/scheduled-service/:scheduledServiceId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Calculate commission for a completed scheduled service',
  })
  @ApiResponse({
    status: 201,
    description: 'Commission calculated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid service status' })
  @ApiResponse({ status: 404, description: 'Scheduled service not found' })
  async calculateForScheduledService(
    @Param('scheduledServiceId') scheduledServiceId: string,
  ) {
    return await this.commissionDomainService.calculateCommission(
      scheduledServiceId,
    );
  }

  @Post('calculate/appointment/:appointmentId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Calculate commissions for all completed services in an appointment',
  })
  @ApiResponse({
    status: 201,
    description: 'Commissions calculated successfully',
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async calculateForAppointment(@Param('appointmentId') appointmentId: string) {
    return await this.commissionDomainService.calculateCommissionsForAppointment(
      appointmentId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all commissions with optional filters' })
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
    description: 'Filter by collaborator ID',
  })
  @ApiResponse({ status: 200, description: 'List of commissions' })
  async findAll(
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

    return await this.commissionDomainService.findAll(
      Object.keys(filters).length > 0 ? filters : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a commission by ID' })
  @ApiResponse({ status: 200, description: 'Commission found' })
  @ApiResponse({ status: 404, description: 'Commission not found' })
  async findOne(@Param('id') id: string) {
    return await this.commissionDomainService.findById(id);
  }

  @Get('collaborator/:collaboratorId')
  @ApiOperation({ summary: 'Get all commissions for a collaborator' })
  @ApiResponse({ status: 200, description: 'List of commissions' })
  async findByCollaborator(@Param('collaboratorId') collaboratorId: string) {
    return await this.commissionDomainService.findByCollaboratorId(
      collaboratorId,
    );
  }

  @Get('pending/all')
  @ApiOperation({ summary: 'Get all pending commissions' })
  @ApiResponse({ status: 200, description: 'List of pending commissions' })
  async findPending() {
    return await this.commissionDomainService.findPending();
  }

  @Put('mark-as-paid')
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
