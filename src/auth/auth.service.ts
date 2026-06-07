import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // 1. Перевірити, чи такий email уже зайнятий
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Користувач з таким email вже існує');
    }

    // 2. Хешуємо пароль (10 раундів шифрування)
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 3. Створюємо користувача в базі
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });

    // 4. Повертаємо дані користувача без хешу пароля (безпека)
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async login(dto: LoginDto) {
    // 1. Шукаємо користувача
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Невірний логін або пароль');
    }

    // 2. Порівнюємо присланий пароль з хешем у базі
    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Невірний логін або пароль');
    }

    // 3. Якщо все добре — генеруємо JWT токен
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}