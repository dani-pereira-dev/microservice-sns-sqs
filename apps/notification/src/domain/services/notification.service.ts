import { Injectable } from '@nestjs/common';
import { OrderStatusEvent } from '@shared/contracts/events';
import { NotificationCommandService } from './notification-command.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationCommandService: NotificationCommandService,
  ) {}

  async handleOrderStatus(event: OrderStatusEvent) {
    return this.notificationCommandService.handleOrderStatus(event);
  }
}
