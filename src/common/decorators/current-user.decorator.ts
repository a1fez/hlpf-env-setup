import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    // Наш JwtAuthGuard вже поклав дані користувача в об'єкт request
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Якщо ми написали @CurrentUser('id'), повернемо тільки ID, 
    // якщо просто @CurrentUser(), повернемо весь об'єкт
    return data ? user?.[data] : user;
  },
);