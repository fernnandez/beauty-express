import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ description: 'Texto da mensagem a enviar' })
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  text: string;
}
