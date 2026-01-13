import {
  Controller,
  Get,
  Put,
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
