import { UserRole } from '@domain/entities/user-role.enum';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

    if (!user || user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Acesso restrito ao backoffice');
    }

    return true;
  }
}
