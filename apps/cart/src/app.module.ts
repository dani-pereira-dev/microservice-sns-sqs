import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createServiceConfig } from '@shared/config/create-service-config';
import { CartModule } from './cart.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
      load: [() => createServiceConfig('cart', 3005)],
    }),
    CartModule,
  ],
})
export class AppModule {}
