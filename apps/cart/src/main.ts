import 'reflect-metadata';
import { bootstrapHttpApp } from '@shared/bootstrap/bootstrap-http-app';
import { AppModule } from './app.module';

const bootstrap = async () => {
  await bootstrapHttpApp(AppModule);
};

bootstrap();
