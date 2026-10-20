import { Injectable, Logger } from '@nestjs/common';

/**
 * Wrapper HTTP para a Evolution API (WhatsApp não oficial, baseada em Baileys).
 * Usa fetch nativo (Node 20+) — sem dependências extras.
 *
 * Configuração via env:
 *  - EVOLUTION_API_URL: base URL da Evolution (ex.: https://evo.meudominio.com)
 *  - EVOLUTION_API_KEY: apikey global da Evolution (header `apikey`)
 */
@Injectable()
export class EvolutionClient {
  private readonly logger = new Logger(EvolutionClient.name);
  private readonly timeoutMs = 15000;

  private get baseUrl(): string {
    const url = process.env.EVOLUTION_API_URL;
    if (!url) {
      throw new Error('EVOLUTION_API_URL não configurada');
    }
    return url.replace(/\/+$/, '');
  }

  private get apiKey(): string {
    const key = process.env.EVOLUTION_API_KEY;
    if (!key) {
      throw new Error('EVOLUTION_API_KEY não configurada');
    }
    return key;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          apikey: this.apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        this.logger.error(
          `Evolution ${method} ${path} falhou: ${response.status} ${text}`,
        );
        throw new Error(`Evolution API respondeu ${response.status}`);
      }

      return data as T;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Evolution API timeout em ${path}`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Envia uma mensagem de texto para um número (só dígitos, com DDI). */
  async sendText(
    instanceName: string,
    phoneNormalized: string,
    text: string,
  ): Promise<EvolutionSendResponse> {
    return await this.request<EvolutionSendResponse>(
      'POST',
      `/message/sendText/${encodeURIComponent(instanceName)}`,
      { number: phoneNormalized, text },
    );
  }

  /**
   * Baixa e descriptografa a mídia de uma mensagem, retornando base64.
   * Usado para figurinhas/imagens, cuja URL do WhatsApp é criptografada.
   */
  async getMediaBase64(
    instanceName: string,
    waMessageId: string,
  ): Promise<EvolutionMediaResponse> {
    return await this.request<EvolutionMediaResponse>(
      'POST',
      `/chat/getBase64FromMediaMessage/${encodeURIComponent(instanceName)}`,
      { message: { key: { id: waMessageId } }, convertToMp4: false },
    );
  }

  /** Cria uma nova instância (um número) na Evolution. */
  async createInstance(
    instanceName: string,
    webhookUrl: string,
  ): Promise<unknown> {
    return await this.request('POST', '/instance/create', {
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      webhook: {
        url: webhookUrl,
        byEvents: false,
        events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE'],
      },
    });
  }

  /** Retorna o QR code / estado de conexão para parear a instância. */
  async connect(instanceName: string): Promise<EvolutionConnectResponse> {
    return await this.request<EvolutionConnectResponse>(
      'GET',
      `/instance/connect/${encodeURIComponent(instanceName)}`,
    );
  }

  /** (Re)configura o webhook de uma instância existente. */
  async setWebhook(instanceName: string, webhookUrl: string): Promise<unknown> {
    return await this.request(
      'POST',
      `/webhook/set/${encodeURIComponent(instanceName)}`,
      {
        webhook: {
          enabled: true,
          url: webhookUrl,
          byEvents: false,
          events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE'],
        },
      },
    );
  }

  /** Envia uma reação (emoji) a uma mensagem. Emoji vazio remove a reação. */
  async sendReaction(
    instanceName: string,
    remoteJid: string,
    fromMe: boolean,
    waMessageId: string,
    emoji: string,
  ): Promise<unknown> {
    return await this.request(
      'POST',
      `/message/sendReaction/${encodeURIComponent(instanceName)}`,
      {
        key: { remoteJid, fromMe, id: waMessageId },
        reaction: emoji,
      },
    );
  }

  /** Desconecta (logout) a sessão do WhatsApp da instância. */
  async logout(instanceName: string): Promise<unknown> {
    return await this.request(
      'DELETE',
      `/instance/logout/${encodeURIComponent(instanceName)}`,
    );
  }
}

export interface EvolutionSendResponse {
  key?: { id?: string };
  status?: string;
}

export interface EvolutionConnectResponse {
  /** QR code em base64 (data URL) para exibir no painel. */
  base64?: string;
  code?: string;
  pairingCode?: string;
}

export interface EvolutionMediaResponse {
  mediaType?: string;
  fileName?: string;
  mimetype?: string;
  /** Conteúdo da mídia em base64 (sem o prefixo data URL). */
  base64?: string;
}
