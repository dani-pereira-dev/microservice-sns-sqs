import 'reflect-metadata';
import { AppModule } from './app.module';
import { bootstrapHttpApp } from '@shared/bootstrap/bootstrap-http-app';

async function bootstrap() {
  await bootstrapHttpApp(AppModule);
}

bootstrap();
