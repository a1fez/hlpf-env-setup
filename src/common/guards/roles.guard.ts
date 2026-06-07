import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  // Reflector — це вбудований інструмент NestJS, який дозволяє читати metadata (мітки @Roles)
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Отримуємо ролі, які ми вказали в @Roles() на рівні методу або класу
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Якщо @Roles() не встановлений — доступ відкритий для всіх авторизованих
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 2. Отримуємо користувача з запиту
    // Важливо: об'єкт user з'являється тут завдяки тому, що ПЕРЕД цим спрацював JwtAuthGuard
    const { user } = context.switchToHttp().getRequest();

    // 3. Перевіряємо, чи є роль користувача в списку дозволених
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        'У вас недостатньо прав (потрібна роль: ' + requiredRoles.join(', ') + ')',
      );
    }

    return true;
  }
}