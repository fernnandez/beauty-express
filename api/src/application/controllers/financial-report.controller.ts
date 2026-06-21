import { FinancialReportService } from '@domain/services/financial-report.service';
import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VALIDATION_CONSTANTS } from '../../common/constants/validation.constants';
import { formatDateToString, parseDateString } from '../../utils/date.util';
import { FinancialReportDto } from '../dtos/financial-report/financial-report.dto';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

@ApiTags('Financial Reports')
@Controller('financial-reports')
export class FinancialReportController {
  constructor(
    private readonly financialReportService: FinancialReportService,
  ) {}

  @Get('monthly')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get monthly financial report',
    description: 'Returns financial report for a specific month and year',
  })
  @ApiQuery({
    name: 'year',
    required: true,
    type: Number,
    description: 'Year (e.g., 2024)',
  })
  @ApiQuery({
    name: 'month',
    required: true,
    type: Number,
    description: 'Month (1-12)',
  })
  @ApiResponse({
    status: 200,
    description: 'Financial report retrieved successfully',
    type: FinancialReportDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid year or month' })
  async getMonthlyReport(
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ): Promise<FinancialReportDto> {
    if (
      month < VALIDATION_CONSTANTS.MONTH.MIN ||
      month > VALIDATION_CONSTANTS.MONTH.MAX
    ) {
      throw new BadRequestException(VALIDATION_CONSTANTS.MONTH.MESSAGE);
    }

    if (
      year < VALIDATION_CONSTANTS.YEAR.MIN ||
      year > VALIDATION_CONSTANTS.YEAR.MAX
    ) {
      throw new BadRequestException(VALIDATION_CONSTANTS.YEAR.MESSAGE);
    }

    return await this.financialReportService.getMonthlyReport(year, month);
  }

  @Get('period')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get financial report for a date range',
    description:
      'Returns financial report for appointments between startDate and endDate (inclusive)',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date (yyyy-mm-dd)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'End date (yyyy-mm-dd)',
  })
  @ApiResponse({
    status: 200,
    description: 'Financial report retrieved successfully',
    type: FinancialReportDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid date range' })
  async getPeriodReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<FinancialReportDto> {
    if (!DATE_PATTERN.test(startDate) || !DATE_PATTERN.test(endDate)) {
      throw new BadRequestException(
        'Invalid date format. Expected yyyy-mm-dd for startDate and endDate',
      );
    }

    const start = parseDateString(startDate);
    const end = parseDateString(endDate);

    if (start > end) {
      throw new BadRequestException(
        'startDate must be less than or equal to endDate',
      );
    }

    return await this.financialReportService.getReportForPeriod(
      formatDateToString(start),
      formatDateToString(end),
    );
  }
}
