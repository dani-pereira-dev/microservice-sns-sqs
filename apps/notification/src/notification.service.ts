import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { ServiceConfig } from '@shared/config/service-config.types';
import { PaymentConfirmation } from '@shared/contracts/payments';
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

  async handlePaymentConfirmed(
    payment: PaymentConfirmation,
    recipientEmail?: string,
  ) {
    const to = recipientEmail?.trim() || this.defaultToEmail;

    if (!this.resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured.');
    }

    if (!to) {
      throw new Error(
        'NOTIFICATION_DEFAULT_TO_EMAIL is not configured and no recipientEmail was provided.',
      );
    }

    const resend = new Resend(this.resendApiKey);

    await resend.emails.send({
      from: this.emailFrom,
      to,
      subject: `Pago confirmado para la orden ${payment.orderId}`,
      text: [
        'Se recibio una confirmacion de pago.',
        '',
        `paymentId: ${payment.paymentId}`,
        `orderId: ${payment.orderId}`,
        `amount: ${payment.amount}`,
        `paymentMethod: ${payment.paymentMethod}`,
        `status: ${payment.status}`,
        `confirmedAt: ${payment.confirmedAt}`,
        `idempotencyKey: ${payment.idempotencyKey}`,
      ].join('\n'),
    });

    this.logger.log(
      formatNotificationLog(
        `Email notification sent for payment ${payment.paymentId} to ${to}.`,
      ),
    );
  }
}
