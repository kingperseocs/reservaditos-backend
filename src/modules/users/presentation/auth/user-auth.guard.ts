import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { USER_ID_HEADER } from '../../../../config/swagger.config';
import {
  DomainError,
  DomainErrorType,
} from '../../../../shared/domain/domain-error';
import { User, UserRole } from '../../domain/user';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../domain/user.repository';

export const ROLES_KEY = 'roles';

export interface AuthenticatedRequest extends Request {
  user: User;
}

/**
 * Simulated identity: the client sends the id of a seeded user in `x-user-id`.
 * Replaceable by a JWT guard without touching controllers or use cases.
 */
@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.header(USER_ID_HEADER)?.trim();
    const user = userId ? await this.users.findById(userId) : null;

    if (!user) {
      throw new DomainError(
        'UNAUTHENTICATED',
        `Envía el header ${USER_ID_HEADER} con un usuario válido.`,
        DomainErrorType.UNAUTHORIZED,
      );
    }

    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (roles?.length && !roles.includes(user.role)) {
      throw new DomainError(
        'FORBIDDEN_ROLE',
        'No tienes permiso para esta acción.',
        DomainErrorType.FORBIDDEN,
      );
    }

    request.user = user;
    return true;
  }
}
