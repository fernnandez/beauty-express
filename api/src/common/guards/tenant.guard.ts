import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';
import { UserRole } from '@domain/entities/user-role.enum';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const path: string = request.path || request.url || '';

    if (
      path.startsWith('/docs') ||
      path.startsWith('/admin') ||
      path.startsWith('/auth/admin')
    ) {
      return true;
    }

    const { user } = request;

    if (!user) {
      return false;
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Super admin deve usar o backoffice em /admin',
      );
    }

    if (!user.tenantId) {
      throw new ForbiddenException('Usuário sem filial associada');
    }

    return true;
  }
}
