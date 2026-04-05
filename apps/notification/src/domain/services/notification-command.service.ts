import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { ServiceConfig } from '@shared/config/service-config.types';
import { OrderStatusEvent } from '@shared/contracts/events';
import { buildNotificationEmailContent } from '../builders/notification-email-content.builder';
import { NotificationDomainLogger } from '../logging/notification-domain.logger';
import {
  requireNotificationRecipient,
  requireNotificationResendApiKey,
} from '../validators/notification.domain.validators';

@Injectable()
export class NotificationCommandService {
  private readonly resendApiKey?: string;
  private readonly emailFrom: string;
  private readonly defaultToEmail?: string;

  constructor(
    private readonly configService: ConfigService<ServiceConfig, true>,
    private readonly notificationDomainLogger: NotificationDomainLogger,
  ) {
    this.resendApiKey = this.configService.get('notification.resendApiKey', {
      infer: true,
    });
    this.emailFrom = this.configService.get('notification.emailFrom', {
      infer: true,
    });
    this.defaultToEmail = this.configService.get(
      'notification.defaultToEmail',
      {
        infer: true,
      },
    );
  }

  async handleOrderStatus(event: OrderStatusEvent) {
    const resend = new Resend(
      requireNotificationResendApiKey(this.resendApiKey),
    );
    const to = requireNotificationRecipient(this.defaultToEmail);
    const { subject, text } = buildNotificationEmailContent(event);

    await resend.emails.send({
      from: this.emailFrom,
      to,
      subject,
      text,
    });

    this.notificationDomainLogger.log(
      `Email notification sent for ${event.eventType} and order ${event.payload.orderId} to ${to}.`,
    );
  }
}
