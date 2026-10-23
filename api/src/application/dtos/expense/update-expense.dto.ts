import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { ExpenseCategory, ExpenseType } from '@domain/entities/expense-enums';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class UpdateExpenseDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, enum: ExpenseCategory })
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @ApiProperty({ required: false, minimum: 0.01 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'amount must be a number with at most 2 decimal places' },
  )
  @Min(0.01, { message: 'amount must be greater than 0' })
  amount?: number;

  @ApiProperty({ required: false, enum: ExpenseType })
  @IsOptional()
  @IsEnum(ExpenseType)
  type?: ExpenseType;

  @ApiProperty({ required: false })
  @IsOptional()
  @Matches(DATE_PATTERN, { message: 'date deve estar no formato yyyy-MM-dd' })
  date?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @Matches(DATE_PATTERN, {
    message: 'startDate deve estar no formato yyyy-MM-dd',
  })
  startDate?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @Matches(DATE_PATTERN, {
    message: 'endDate deve estar no formato yyyy-MM-dd',
  })
  endDate?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
