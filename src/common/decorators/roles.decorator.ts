import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

// Ключ, за яким RolesGuard буде шукати список дозволених ролей
export const ROLES_KEY = 'roles';

// Декоратор приймає список ролей, наприклад @Roles(Role.ADMIN, Role.USER)
export const Roles = (...roles: Role[]) =>
  SetMetadata(ROLES_KEY, roles);