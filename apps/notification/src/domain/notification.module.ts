import { Module } from '@nestjs/common';
import { NotificationEventsConsumer } from '../messaging/notification-events.consumer';
import { NotificationDomainLogger } from './logging/notification-domain.logger';
import { NotificationCommandService } from './services/notification-command.service';
import { NotificationService } from './services/notification.service';

@Module({
  providers: [
    NotificationDomainLogger,
    NotificationCommandService,
    NotificationService,
    NotificationEventsConsumer,
  ],
})
export class NotificationModule {}
