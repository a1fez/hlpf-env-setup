import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Отримуємо об'єкт запиту (Request)
    const request = context.switchToHttp().getRequest<Request>();

    // 2. Витягуємо токен із заголовка Authorization
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Токен авторизації відсутній');
    }

    try {
      // 3. Верифікуємо токен
      const payload = this.jwtService.verify(token);
      
      // 4. "Прикріплюємо" дані користувача до запиту.
      // Тепер у будь-якому контролері ми зможемо дізнатися, хто робить запит через req.user
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Невалідний або прострочений токен');
    }

    return true;
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}