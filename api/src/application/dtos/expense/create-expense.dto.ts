import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import {
  ExpenseCategory,
  ExpenseType,
} from '@domain/entities/expense-enums';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class CreateExpenseDto {
  @ApiProperty({ example: 'Aluguel' })
  @IsString()
  description: string;

  @ApiProperty({ enum: ExpenseCategory, example: ExpenseCategory.RENT })
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @ApiProperty({ example: 2000.0, minimum: 0.01 })
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'amount must be a number with at most 2 decimal places' },
  )
  @Min(0.01, { message: 'amount must be greater than 0' })
  amount: number;

  @ApiProperty({ enum: ExpenseType, example: ExpenseType.RECURRING })
  @IsEnum(ExpenseType)
  type: ExpenseType;

  @ApiProperty({
    required: false,
    example: '2026-10-05',
    description: 'Data da despesa esporádica (yyyy-MM-dd)',
  })
  @IsOptional()
  @Matches(DATE_PATTERN, { message: 'date deve estar no formato yyyy-MM-dd' })
  date?: string;

  @ApiProperty({
    required: false,
    example: 10,
    description: 'Dia de vencimento da despesa fixa (1-31)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @ApiProperty({ required: false, example: '2026-01-01' })
  @IsOptional()
  @Matches(DATE_PATTERN, {
    message: 'startDate deve estar no formato yyyy-MM-dd',
  })
  startDate?: string;

  @ApiProperty({ required: false, example: '2026-12-31' })
  @IsOptional()
  @Matches(DATE_PATTERN, { message: 'endDate deve estar no formato yyyy-MM-dd' })
  endDate?: string;
}
