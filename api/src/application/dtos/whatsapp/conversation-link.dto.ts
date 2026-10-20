import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class StartConversationDto {
  @ApiProperty({ description: 'ID do cliente para iniciar a conversa' })
  @IsUUID()
  clientId: string;
}

export class LinkConversationDto {
  @ApiProperty({ description: 'ID do cliente a vincular à conversa' })
  @IsUUID()
  clientId: string;
}
