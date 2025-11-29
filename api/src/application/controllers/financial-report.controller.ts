import { FinancialReportService } from '@domain/services/financial-report.service';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FinancialReportDto } from '../dtos/financial-report/financial-report.dto';

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
    // Valida o mês
    if (month < 1 || month > 12) {
      throw new Error('Month must be between 1 and 12');
    }

    // Valida o ano
    if (year < 2000 || year > 2100) {
      throw new Error('Year must be between 2000 and 2100');
    }

    return await this.financialReportService.getMonthlyReport(year, month);
  }
}
