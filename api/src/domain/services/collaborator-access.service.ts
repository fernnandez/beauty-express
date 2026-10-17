import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../entities/user-role.enum';
import { CollaboratorRepository } from '../repositories/collaborator.repository';
import { UserRepository } from '../repositories/user.repository';
import { TenantContextService } from './tenant-context.service';
import {
  GrantCollaboratorAccessDto,
  UpdateCollaboratorAccessDto,
} from '@application/dtos/collaborator/collaborator-access.dto';

export interface CollaboratorAccessStatus {
  hasAccess: boolean;
  userId: string | null;
  email: string | null;
  isActive: boolean | null;
}

@Injectable({ scope: Scope.REQUEST })
export class CollaboratorAccessService {
  constructor(
    private readonly collaboratorRepository: CollaboratorRepository,
    private readonly userRepository: UserRepository,
    private readonly tenantContext: TenantContextService,
  ) {}

  private getTenantId(): string {
    return this.tenantContext.requireTenantId();
  }

  private async requireCollaborator(collaboratorId: string): Promise<void> {
    const collaborator = await this.collaboratorRepository.findById(
      collaboratorId,
      this.getTenantId(),
    );
    if (!collaborator) {
      throw new NotFoundException('Colaborador não encontrado');
    }
  }

  private async findAccessUser(collaboratorId: string) {
    return await this.userRepository.findOne({
      where: { collaboratorId, tenantId: this.getTenantId() },
    });
  }

  async getStatus(collaboratorId: string): Promise<CollaboratorAccessStatus> {
    await this.requireCollaborator(collaboratorId);
    const user = await this.findAccessUser(collaboratorId);

    return {
      hasAccess: Boolean(user),
      userId: user?.id ?? null,
      email: user?.email ?? null,
      isActive: user?.isActive ?? null,
    };
  }

  async grant(
    collaboratorId: string,
    dto: GrantCollaboratorAccessDto,
  ): Promise<CollaboratorAccessStatus> {
    await this.requireCollaborator(collaboratorId);
    const tenantId = this.getTenantId();

    const existing = await this.findAccessUser(collaboratorId);
    if (existing) {
      throw new BadRequestException(
        'Este colaborador já possui acesso. Use a edição para alterar.',
      );
    }

    // E-mail deve ser único dentro do tenant.
    const emailTaken = await this.userRepository.findByEmailAndTenant(
      dto.email,
      tenantId,
    );
    if (emailTaken) {
      throw new BadRequestException('E-mail já cadastrado nesta filial');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userRepository.save({
      email: dto.email,
      passwordHash,
      role: UserRole.COLLABORATOR,
      tenantId,
      collaboratorId,
      isActive: true,
    });

    return {
      hasAccess: true,
      userId: user.id,
      email: user.email,
      isActive: user.isActive,
    };
  }

  async update(
    collaboratorId: string,
    dto: UpdateCollaboratorAccessDto,
  ): Promise<CollaboratorAccessStatus> {
    await this.requireCollaborator(collaboratorId);
    const tenantId = this.getTenantId();

    const user = await this.findAccessUser(collaboratorId);
    if (!user) {
      throw new NotFoundException('Colaborador não possui acesso');
    }

    const updates: Partial<{
      email: string;
      passwordHash: string;
      isActive: boolean;
    }> = {};

    if (dto.email !== undefined && dto.email !== user.email) {
      const emailTaken = await this.userRepository.findByEmailAndTenant(
        dto.email,
        tenantId,
        user.id,
      );
      if (emailTaken) {
        throw new BadRequestException('E-mail já cadastrado nesta filial');
      }
      updates.email = dto.email;
    }

    if (dto.password) {
      updates.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (dto.isActive !== undefined) {
      updates.isActive = dto.isActive;
    }

    if (Object.keys(updates).length > 0) {
      await this.userRepository.update({ id: user.id, tenantId }, updates);
    }

    const updated = await this.findAccessUser(collaboratorId);
    return {
      hasAccess: true,
      userId: updated?.id ?? null,
      email: updated?.email ?? null,
      isActive: updated?.isActive ?? null,
    };
  }

  async revoke(collaboratorId: string): Promise<void> {
    await this.requireCollaborator(collaboratorId);
    const user = await this.findAccessUser(collaboratorId);
    if (!user) {
      throw new NotFoundException('Colaborador não possui acesso');
    }
    await this.userRepository.delete({
      id: user.id,
      tenantId: this.getTenantId(),
    });
  }
}
