import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import { USER_ID_HEADER } from '../../../../config/swagger.config';
import { ApiErrorResponses } from '../../../../shared/infrastructure/http/api-error-responses.decorator';
import { User, UserRole } from '../../domain/user';
import {
  AuthenticatedRequest,
  ROLES_KEY,
  UserAuthGuard,
} from './user-auth.guard';

/** Requires the x-user-id header and one of the given roles. */
export function Auth(...roles: UserRole[]): ClassDecorator & MethodDecorator {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(UserAuthGuard),
    ApiSecurity(USER_ID_HEADER),
    ApiErrorResponses(401, 403),
  );
}

export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): User =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
