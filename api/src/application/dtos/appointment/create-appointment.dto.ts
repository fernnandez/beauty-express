import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

export class ScheduledServiceInputDto {
  @ApiProperty({ example: 'service-id-123' })
  @IsString()
  serviceId: string;

  @ApiProperty({ example: 'collaborator-id-123', required: false })
  @IsString()
  @IsOptional()
  collaboratorId?: string;

  @ApiProperty({ example: 100.0, required: false })
  @IsNumber()
  @IsOptional()
  price?: number;
}

export class CreateAppointmentDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  clientName: string;

  @ApiProperty({ example: '(11) 99999-9999' })
  @IsString()
  clientPhone: string;

  @ApiProperty({
    example: '2024-12-28',
    description: 'Data principal do agendamento (formato YYYY-MM-DD)',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Data deve estar no formato YYYY-MM-DD',
  })
  date: string;

  @ApiProperty({
    example: '09:00',
    description: 'Horário de início (formato HH:MM)',
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Invalid time format. Use HH:MM format',
  })
  startTime: string;

  @ApiProperty({
    example: '11:00',
    description: 'Horário de término (formato HH:MM)',
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Invalid time format. Use HH:MM format',
  })
  endTime: string;

  @ApiProperty({
    type: [ScheduledServiceInputDto],
    description: 'Lista de serviços a serem agendados',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduledServiceInputDto)
  servicos: ScheduledServiceInputDto[];

  @ApiProperty({
    example: 'Observações sobre o agendamento',
    required: false,
  })
  @IsString()
  @IsOptional()
  observacoes?: string;
}
