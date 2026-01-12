import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateAppointmentDto {
  @ApiProperty({ example: 'João Silva', required: false })
  @IsString()
  @IsOptional()
  clientName?: string;

  @ApiProperty({ example: '(11) 99999-9999', required: false })
  @IsString()
  @IsOptional()
  clientPhone?: string;

  @ApiProperty({
    example: '2024-12-28',
    description: 'Data principal do agendamento (formato YYYY-MM-DD)',
    required: false,
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Data deve estar no formato YYYY-MM-DD',
  })
  @IsOptional()
  date?: string;

  @ApiProperty({
    example: '09:00',
    description: 'Horário de início (formato HH:MM)',
    required: false,
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Invalid time format. Use HH:MM format',
  })
  @IsOptional()
  startTime?: string;

  @ApiProperty({
    example: '11:00',
    description: 'Horário de término (formato HH:MM)',
    required: false,
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Invalid time format. Use HH:MM format',
  })
  @IsOptional()
  endTime?: string;

  @ApiProperty({
    example: 'Observações sobre o agendamento',
    required: false,
  })
  @IsString()
  @IsOptional()
  observations?: string;
}
