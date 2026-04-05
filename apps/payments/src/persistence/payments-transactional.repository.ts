import { Injectable } from '@nestjs/common';
import { PaymentConfirmedEvent } from '@shared/contracts/events';
import { PaymentConfirmation } from '@shared/contracts/payments';
import { PaymentsDatabase } from './payments-database';

@Injectable()
export class PaymentsTransactionalRepository {
  constructor(private readonly paymentsDatabase: PaymentsDatabase) {}

  createWithOutbox(
    payment: PaymentConfirmation,
    event: PaymentConfirmedEvent,
    topicArn: string,
  ): PaymentConfirmation {
    this.paymentsDatabase.runInTransaction((database) => {
      database
        .prepare(
          `
            INSERT INTO payments (
              idempotency_key, payment_id, order_id, amount, payment_method, status, confirmed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
        )
        .run(
          payment.idempotencyKey,
          payment.paymentId,
          payment.orderId,
          payment.amount,
          payment.paymentMethod,
          payment.status,
          payment.confirmedAt,
        );

      database
        .prepare(
          `
            INSERT INTO payment_outbox (
              event_id, topic_arn, message_json, attributes_json, status, attempts, last_error, created_at, published_at
            ) VALUES (?, ?, ?, ?, 'pending', 0, NULL, ?, NULL)
          `,
        )
        .run(
          event.eventId,
          topicArn,
          JSON.stringify(event),
          JSON.stringify({
            eventType: event.eventType,
            source: event.source,
          }),
          event.occurredAt,
        );
    });

    return payment;
  }
}
