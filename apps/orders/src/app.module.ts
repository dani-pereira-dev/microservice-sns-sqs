import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createServiceConfig } from '@shared/config/create-service-config';
import { MessagingModule } from '@shared/messaging/messaging.module';
import { OrdersModule } from './domain/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
      load: [() => createServiceConfig('orders', 3001)],
    }),
    MessagingModule.register({
      serviceName: 'orders',
    }),
    OrdersModule,
  ],
})
export class AppModule {}
