import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('API_PORT', 3001);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  const corsOrigins = configService.get<string>('CORS_ORIGINS', 'http://localhost:3000').split(',');

  // Security
  app.use(helmet({ crossOriginEmbedderPolicy: false }));
  app.use(compression());

  // Increase body limits for audio and file payloads
  const express = require('express');
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // CORS
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  // Versioning
  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global pipes, filters, interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // WebSockets adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SERVIMIL OS API')
    .setDescription('Enterprise ERP/CRM Platform — REST API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('Auth', 'Authentication & Authorization')
    .addTag('Users', 'User Management')
    .addTag('Clients', 'Client Management')
    .addTag('Finance', 'Finance & Treasury')
    .addTag('Payroll', 'Payroll & Compliance')
    .addTag('Credit', 'Credit & Portfolio')
    .addTag('CRM', 'Customer Relationship Management')
    .addTag('WhatsApp', 'WhatsApp Integration')
    .addTag('Legal', 'Legal Agenda')
    .addTag('Documents', 'Document Management & OCR')
    .addTag('AI', 'AI Gateway & Analysis')
    .addTag('Reports', 'Reports & Analytics')
    .addTag('Notifications', 'Notifications')
    .addTag('Webhooks', 'Webhook Management')
    .addTag('Admin', 'System Administration')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 SERVIMIL OS API running on: http://localhost:${port}/${apiPrefix}/v1`);
  console.log(`📚 Swagger docs at: http://localhost:${port}/${apiPrefix}/docs`);
  console.log(`🌍 Environment: ${configService.get('NODE_ENV')}`);
}

bootstrap();
