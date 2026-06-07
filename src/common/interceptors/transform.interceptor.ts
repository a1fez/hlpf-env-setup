import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Описуємо структуру, яку буде бачити клієнт
export interface Response<T> {
  data: T;
  statusCode: number;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    // Отримуємо поточний статус-код відповіді (напр. 200 або 201)
    const statusCode = context.switchToHttp().getResponse().statusCode;

    return next.handle().pipe(
      map((data) => ({
        data,                                // Самі дані (масив товарів або об'єкт)
        statusCode,                          // Код успіху
        timestamp: new Date().toISOString(), // Час відповіді
      })),
    );
  }
}