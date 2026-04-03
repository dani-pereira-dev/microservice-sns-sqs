import { Module } from '@nestjs/common';
import { NotificationEventsConsumer } from './notification-events.consumer';
import { NotificationService } from './notification.service';

@Module({
  providers: [NotificationService, NotificationEventsConsumer],
})
export class NotificationModule {}
