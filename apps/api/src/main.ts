import 'reflect-metadata';
import 'dotenv/config';
import helmet from 'helmet';
import { json, urlencoded, Request } from 'express';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { validateEnvironment } from './config/environment';

async function bootstrap() {
  validateEnvironment();
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(json({ limit: '5mb', inflate: false, verify: (request, _response, body) => {
    const expressRequest = request as Request & { rawBody?: Buffer };
    if (expressRequest.originalUrl.split('?')[0].endsWith('/webhooks/whatsapp')) {
      expressRequest.rawBody = Buffer.from(body);
    }
  } }));
  app.use(urlencoded({ extended: true, limit: '5mb', inflate: false }));
  app.use(helmet());
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',').map((value) => value.trim()),
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.enableShutdownHooks();
  const openApi = new DocumentBuilder().setTitle('Executive Lead Control API').setDescription('Internal lead operations API').setVersion('1.0').addBearerAuth().build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, openApi));
  const host = process.env.API_HOST ?? (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
  await app.listen(Number(process.env.PORT ?? 4000), host);
}

void bootstrap();
