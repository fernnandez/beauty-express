import { CreateClientDto } from '@application/dtos/client/create-client.dto';
import { UpdateClientDto } from '@application/dtos/client/update-client.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import {
  isValidPhone,
  preparePhoneForStorage,
} from '../../common/utils/phone.util';
import { Client } from '../entities/client.entity';
import { ClientRepository } from '../repositories/client.repository';
import { TenantContextService } from './tenant-context.service';

export interface ResolvedClientData {
  clientId: string;
  clientName: string;
  clientPhone: string;
}

@Injectable({ scope: Scope.REQUEST })
export class ClientService {
  constructor(
    private repository: ClientRepository,
    private tenantContext: TenantContextService,
  ) {}

  private getTenantId(): string {
    return this.tenantContext.requireTenantId();
  }

  private validatePhone(phone: string): { phone: string; phoneNormalized: string } {
    if (!isValidPhone(phone)) {
      throw new BadRequestException(
        'Telefone inválido. Use DDD + número (BR) ou internacional com +.',
      );
    }

    return preparePhoneForStorage(phone);
  }

  async createClient(createDto: CreateClientDto): Promise<Client> {
    const name = createDto.name.trim();
    if (name.length < 2) {
      throw new BadRequestException('Nome deve ter pelo menos 2 caracteres');
    }

    const { phone, phoneNormalized } = this.validatePhone(createDto.phone);
    const tenantId = this.getTenantId();

    const existing = await this.repository.findByPhoneNormalized(
      phoneNormalized,
      tenantId,
    );
    if (existing) {
      throw new BadRequestException('Já existe um cliente com este telefone');
    }

    return await this.repository.save({
      tenantId,
      name,
      phone,
      phoneNormalized,
    });
  }

  async findAll(search?: string): Promise<Client[]> {
    const tenantId = this.getTenantId();

    if (search && search.trim()) {
      return await this.repository.search(search.trim(), tenantId);
    }

    return await this.repository.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Client | null> {
    return await this.repository.findById(id, this.getTenantId());
  }

  async updateClient(id: string, updateDto: UpdateClientDto): Promise<Client> {
    const client = await this.repository.findById(id, this.getTenantId());
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const updatePayload: Partial<Client> = {};

    if (updateDto.name !== undefined) {
      const name = updateDto.name.trim();
      if (name.length < 2) {
        throw new BadRequestException('Nome deve ter pelo menos 2 caracteres');
      }
      updatePayload.name = name;
    }

    if (updateDto.phone !== undefined) {
      const { phone, phoneNormalized } = this.validatePhone(updateDto.phone);
      const existing = await this.repository.findByPhoneNormalized(
        phoneNormalized,
        this.getTenantId(),
      );
      if (existing && existing.id !== id) {
        throw new BadRequestException('Já existe um cliente com este telefone');
      }
      updatePayload.phone = phone;
      updatePayload.phoneNormalized = phoneNormalized;
    }

    await this.repository.update(
      { id, tenantId: this.getTenantId() },
      updatePayload,
    );

    return await this.repository.findById(id, this.getTenantId());
  }

  async delete(id: string): Promise<void> {
    const client = await this.repository.findById(id, this.getTenantId());
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    await this.repository.delete({ id, tenantId: this.getTenantId() });
  }

  async resolveClientForAppointment(
    clientName: string,
    clientPhone: string,
    clientId?: string,
  ): Promise<ResolvedClientData> {
    const name = clientName.trim();
    if (name.length < 2) {
      throw new BadRequestException('Nome do cliente é obrigatório');
    }

    const { phone, phoneNormalized } = this.validatePhone(clientPhone);
    const tenantId = this.getTenantId();

    if (clientId) {
      const selectedClient = await this.repository.findById(clientId, tenantId);
      if (!selectedClient) {
        throw new NotFoundException('Cliente selecionado não encontrado');
      }

      if (selectedClient.phoneNormalized !== phoneNormalized) {
        const phoneOwner = await this.repository.findByPhoneNormalized(
          phoneNormalized,
          tenantId,
        );
        if (phoneOwner && phoneOwner.id !== clientId) {
          throw new BadRequestException('Já existe um cliente com este telefone');
        }
      }

      if (selectedClient.name !== name || selectedClient.phone !== phone) {
        await this.repository.update(
          { id: clientId, tenantId },
          { name, phone, phoneNormalized },
        );
      }

      return { clientId, clientName: name, clientPhone: phone };
    }

    const existing = await this.repository.findByPhoneNormalized(
      phoneNormalized,
      tenantId,
    );

    if (existing) {
      if (existing.name !== name || existing.phone !== phone) {
        await this.repository.update(
          { id: existing.id, tenantId },
          { name, phone, phoneNormalized },
        );
      }

      return {
        clientId: existing.id,
        clientName: name,
        clientPhone: phone,
      };
    }

    const created = await this.repository.save({
      tenantId,
      name,
      phone,
      phoneNormalized,
    });

    return {
      clientId: created.id,
      clientName: name,
      clientPhone: phone,
    };
  }
}
