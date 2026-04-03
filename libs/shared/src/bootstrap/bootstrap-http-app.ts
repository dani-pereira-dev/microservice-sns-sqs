import { Logger, Type } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ServiceConfig } from '../config/service-config.types';

export async function bootstrapHttpApp(rootModule: Type<unknown>) {
  const app = await NestFactory.create(rootModule);
  const configService = app.get<ConfigService<ServiceConfig, true>>(ConfigService);
  const serviceName = configService.get('app.name', { infer: true });
  const port = configService.get('app.port', { infer: true });

  app.enableShutdownHooks();

  await app.listen(port);

  const logger = new Logger(serviceName);
  logger.log(`HTTP server listening on http://localhost:${port}`);
}
