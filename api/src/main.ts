import './bootstrap-paths';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import {
  filterSwaggerPaths,
  isAdminSwaggerPath,
} from '@common/utils/swagger.util';

function getCorsOrigins(): string[] | string {
  if (process.env.CORS_ORIGIN) {
    const origins = process.env.CORS_ORIGIN.split(',').map((o) => o.trim());
    return origins.length === 1 ? origins[0] : origins;
  }

  return process.env.NODE_ENV === 'production'
    ? []
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new HttpExceptionFilter());

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
    origin: getCorsOrigins(),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  const operationalConfig = new DocumentBuilder()
    .setTitle('Beauty Express API — Operacional')
    .setDescription('Endpoints das filiais (agendamentos, colaboradores, etc.)')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Login e sessão das filiais')
    .addTag('Collaborators', 'Colaboradores da filial')
    .addTag('Services', 'Serviços da filial')
    .addTag('Appointments', 'Agendamentos')
    .addTag('Commissions', 'Comissões')
    .build();

  const adminConfig = new DocumentBuilder()
    .setTitle('Beauty Express API — Backoffice')
    .setDescription('Endpoints exclusivos do super admin')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Login e sessão do backoffice')
    .addTag('Admin', 'Gestão de filiais, usuários e auditoria')
    .build();

  const fullDocument = SwaggerModule.createDocument(app, operationalConfig);
  const operationalDocument = filterSwaggerPaths(
    fullDocument,
    (path) => !isAdminSwaggerPath(path),
  );
  const adminDocument = filterSwaggerPaths(fullDocument, isAdminSwaggerPath);

  adminDocument.info = adminConfig.info;
  adminDocument.tags = adminConfig.tags;

  SwaggerModule.setup('docs', app, operationalDocument);
  SwaggerModule.setup('docs/admin', app, adminDocument);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  Logger.log(`Application is running on: http://localhost:${port}`);
  Logger.log(`Swagger operacional: http://localhost:${port}/docs`);
  Logger.log(`Swagger backoffice: http://localhost:${port}/docs/admin`);
}

bootstrap();
