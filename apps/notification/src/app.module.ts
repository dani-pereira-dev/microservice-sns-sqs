import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createServiceConfig } from '@shared/config/create-service-config';
import { MessagingModule } from '@shared/messaging/messaging.module';
import { NotificationModule } from './domain/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
      load: [() => createServiceConfig('notification', 3003)],
    }),
    MessagingModule.register({
      serviceName: 'notification',
    }),
    NotificationModule,
  ],
})
export class AppModule {}
