import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { ServiceConfig } from '@shared/config/service-config.types';
import {
  ORDER_CONFIRMATION_FAILED_EVENT,
  ORDER_CONFIRMED_EVENT,
  OrderStatusEvent,
} from '@shared/contracts/events';
import { formatNotificationLog } from '@shared/messaging/messaging-log.utils';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly resendApiKey?: string;
  private readonly emailFrom: string;
  private readonly defaultToEmail?: string;

  constructor(
    private readonly configService: ConfigService<ServiceConfig, true>,
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
    const to = this.defaultToEmail;

    if (!this.resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured.');
    }

    if (!to) {
      throw new Error(
        'NOTIFICATION_DEFAULT_TO_EMAIL is not configured and no recipientEmail was provided.',
      );
    }

    const resend = new Resend(this.resendApiKey);
    const { subject, text } = this.buildEmailContent(event);

    await resend.emails.send({
      from: this.emailFrom,
      to,
      subject,
      text,
    });

    this.logger.log(
      formatNotificationLog(
        `Email notification sent for ${event.eventType} and order ${event.payload.orderId} to ${to}.`,
      ),
    );
  }

  private buildEmailContent(event: OrderStatusEvent) {
    if (event.eventType === ORDER_CONFIRMED_EVENT) {
      return {
        subject: `Orden confirmada: ${event.payload.orderId}`,
        text: [
          'La orden fue confirmada correctamente.',
          '',
          `orderId: ${event.payload.orderId}`,
          `customerName: ${event.payload.customerName}`,
          `amount: ${event.payload.amount}`,
          `paymentId: ${event.payload.payment.paymentId}`,
          `paymentMethod: ${event.payload.payment.paymentMethod}`,
          `confirmedAt: ${event.payload.confirmedAt}`,
          `idempotencyKey: ${event.payload.payment.idempotencyKey}`,
          'resultado: exito',
        ].join('\n'),
      };
    }

    if (event.eventType === ORDER_CONFIRMATION_FAILED_EVENT) {
      return {
        subject: `Fallo en confirmacion de orden: ${event.payload.orderId}`,
        text: [
          'La orden no pudo confirmarse.',
          '',
          `orderId: ${event.payload.orderId}`,
          `paymentId: ${event.payload.payment.paymentId}`,
          `amount: ${event.payload.payment.amount}`,
          `paymentMethod: ${event.payload.payment.paymentMethod}`,
          `failedAt: ${event.payload.failedAt}`,
          `idempotencyKey: ${event.payload.payment.idempotencyKey}`,
          `motivo: ${event.payload.reason}`,
          'resultado: fallo',
        ].join('\n'),
      };
    }

    throw new Error('Unsupported order status event.');
  }
}
