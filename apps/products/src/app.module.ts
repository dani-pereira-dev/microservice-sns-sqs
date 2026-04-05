import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createServiceConfig } from '@shared/config/create-service-config';
import { ProductsModule } from './domain/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
      load: [() => createServiceConfig('products', 3004)],
    }),
    ProductsModule,
  ],
})
export class AppModule {}
