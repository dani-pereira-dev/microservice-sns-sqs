import { Module } from '@nestjs/common';
import { NotificationEventsConsumer } from '../messaging/notification-events.consumer';
import { NotificationCommandService } from './services/notification-command.service';
import { NotificationService } from './services/notification.service';

@Module({
  providers: [
    NotificationCommandService,
    NotificationService,
    NotificationEventsConsumer,
  ],
})
export class NotificationModule {}
