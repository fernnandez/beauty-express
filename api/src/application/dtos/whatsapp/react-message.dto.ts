import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class ReactMessageDto {
  @ApiProperty({ description: 'Emoji da reação. Vazio remove a reação.' })
  @IsString()
  @MaxLength(16)
  emoji: string;
}
