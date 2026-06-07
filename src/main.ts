import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // Нові імпорти
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TrimPipe } from './common/pipes/trim.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true, // ЦЕЙ РЯДОК ОБОВ'ЯЗКОВИЙ для роботи Query параметрів
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true, // Допомагає автоматично конвертувати типи
    },
  }));

  // 2. Глобальні інтерцептори та фільтри (Логування, обгортка відповідей, помилки)
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // 3. НАЛАШТУВАННЯ SWAGGER
  const config = new DocumentBuilder()
    .setTitle('MiniShop API')
    .setDescription(
      'REST API для навчального інтернет-магазину. ' +
      'Автентифікація через JWT Bearer token.',
    )
    .setVersion('1.0')
    .addBearerAuth() // Додає кнопку "Authorize" зверху
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.APP_PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}
bootstrap();