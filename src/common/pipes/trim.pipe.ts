import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class TrimPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // Обробляємо лише тіло запиту (body) і лише якщо це об'єкт
    if (metadata.type !== 'body' || typeof value !== 'object' || value === null) {
      return value;
    }

    // Проходимо по всіх полях об'єкта
    const trimmed: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      // Якщо значення — рядок, обрізаємо пробіли
      trimmed[key] = typeof val === 'string' ? val.trim() : val;
    }

    return trimmed;
  }
}