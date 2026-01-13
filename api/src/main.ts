import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Beauty Express API')
    .setDescription('Backend API for beauty salon management system')
    .setVersion('1.0')
    .addTag('Collaborators', 'Collaborator management endpoints')
    .addTag('Services', 'Service catalog endpoints')
    .addTag('Appointments', 'Appointment scheduling endpoints')
    .addTag('Commissions', 'Commission calculation endpoints')
    .build();

  // Configurar prefixo global para todas as rotas da API
  app.setGlobalPrefix('api');

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  Logger.log(`🚀 Application is running on: http://localhost:${port}`);
  Logger.log(`📱 Frontend: http://localhost:${port}`);
  Logger.log(`🔌 API: http://localhost:${port}/api`);
  Logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
