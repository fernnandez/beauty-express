import { Injectable, NotFoundException } from '@nestjs/common';
import { LoginBranding } from '../types/branding.types';
import { PortalRepository } from '../repositories/portal.repository';
import { normalizeLoginBranding, normalizePortalHost } from './tenant-settings.util';

/** Hosts alternativos → host cadastrado no portal (dev/local). */
const PORTAL_HOST_ALIASES: Record<string, string> = {
  '127.0.0.1': 'localhost',
};

export interface PortalResolveResponse {
  id: string;
  slug: string;
  host: string;
  loginBranding: LoginBranding;
}

@Injectable()
export class PortalService {
  constructor(private readonly portalRepository: PortalRepository) {}

  async resolveByHost(host: string): Promise<PortalResolveResponse> {
    const portal = await this.findPortalByHost(host);

    if (!portal || !portal.isActive) {
      throw new NotFoundException('Portal não encontrado');
    }

    return this.toResolveResponse(portal);
  }

  private async findPortalByHost(host: string) {
    const normalizedHost = normalizePortalHost(host);
    let portal = await this.portalRepository.findByHost(normalizedHost);

    if (!portal) {
      const alias = PORTAL_HOST_ALIASES[normalizedHost];
      if (alias) {
        portal = await this.portalRepository.findByHost(alias);
      }
    }

    return portal;
  }

  async listActivePortals(): Promise<PortalResolveResponse[]> {
    const portals = await this.portalRepository.find({
      where: { isActive: true },
      order: { slug: 'ASC' },
    });

    return portals.map((portal) => this.toResolveResponse(portal));
  }

  normalizeHost(host: string): string {
    return normalizePortalHost(host);
  }

  private toResolveResponse(portal: {
    id: string;
    slug: string;
    host: string;
    loginBranding: Partial<LoginBranding> | null;
  }): PortalResolveResponse {
    return {
      id: portal.id,
      slug: portal.slug,
      host: portal.host,
      loginBranding: normalizeLoginBranding(
        portal.loginBranding,
        portal.slug,
      ),
    };
  }
}
