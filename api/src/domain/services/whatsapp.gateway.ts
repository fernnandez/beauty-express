import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { jwtConfig } from '@config/jwt.config';
import { AccessTokenPayload } from './auth.types';

/**
 * Gateway de tempo real do atendimento (WhatsApp).
 * Cada tenant tem a sua "room"; eventos de mensagem/conversa são emitidos
 * só para a room do tenant. A conexão é autenticada pelo token de acesso
 * (handshake auth.token ou query token).
 */
@WebSocketGateway({
  namespace: '/whatsapp',
  cors: { origin: true, credentials: true },
})
export class WhatsappGateway implements OnGatewayConnection {
  private readonly logger = new Logger(WhatsappGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  private tenantRoom(tenantId: string): string {
    return `tenant:${tenantId}`;
  }

  handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ||
        (client.handshake.query?.token as string | undefined);
      if (!token) {
        client.disconnect(true);
        return;
      }
      const payload = this.jwtService.verify<AccessTokenPayload>(token, {
        secret: jwtConfig.accessSecret,
      });
      if (payload.type !== 'access' || !payload.tenantId) {
        client.disconnect(true);
        return;
      }
      client.join(this.tenantRoom(payload.tenantId));
    } catch {
      client.disconnect(true);
    }
  }

  /** Emite um evento de atualização do inbox para a room do tenant. */
  emitInboxUpdate(
    tenantId: string,
    payload: { conversationId?: string; kind: string },
  ): void {
    // server pode não estar pronto em testes; protege.
    this.server?.to(this.tenantRoom(tenantId)).emit('whatsapp:update', payload);
  }

  /** Emite mudança de estado da conexão (conectado/desconectado) ao tenant. */
  emitConnectionUpdate(tenantId: string, status: string): void {
    this.server
      ?.to(this.tenantRoom(tenantId))
      .emit('whatsapp:connection', { status });
  }
}
