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
import { CommissionFilterParams } from '@domain/repositories/commission-list.types';

@ApiTags('Commissions')
@Controller('commissions')
export class CommissionController {
  constructor(private readonly commissionDomainService: CommissionService) {}

  @Get()
  @ApiOperation({ summary: 'Get commissions with optional filters and pagination' })
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
    isArray: true,
    description: 'Filter by one or more collaborator IDs',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by collaborator, service or client name',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 50, max: 100)',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of commissions' })
  async findAll(
    @Query('paid') paid?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('collaboratorId') collaboratorId?: string | string[],
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: CommissionFilterParams = {};
    const parsedPage = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const parsedLimit = Math.min(
      100,
      Math.max(1, parseInt(limit ?? '50', 10) || 50),
    );

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
      filters.collaboratorIds = Array.isArray(collaboratorId)
        ? collaboratorId
        : [collaboratorId];
    }

    const trimmedSearch = search?.trim();
    if (trimmedSearch) {
      filters.search = trimmedSearch;
    }

    return await this.commissionDomainService.findAll(
      Object.keys(filters).length > 0 ? filters : undefined,
      parsedPage,
      parsedLimit,
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
