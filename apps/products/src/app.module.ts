import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createServiceConfig } from '@shared/config/create-service-config';
import { MessagingModule } from '@shared/messaging/messaging.module';
import { ProductsDatabaseModule } from './persistence/product-events/products-database.module';
import { ProductsModule } from './domain/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
      load: [() => createServiceConfig('products', 3004)],
    }),
    MessagingModule.register({
      serviceName: 'products',
    }),
    ProductsDatabaseModule,
    ProductsModule,
  ],
})
export class AppModule {}
