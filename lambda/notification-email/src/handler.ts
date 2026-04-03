import type {
  SQSBatchItemFailure,
  SQSBatchResponse,
  SQSHandler,
} from 'aws-lambda';
import { sendPaymentConfirmationEmail } from './email-service';
import { parsePaymentConfirmedEvent } from './event-parser';
import { logError, logInfo } from './logger';
import { PAYMENT_CONFIRMED_EVENT } from './types';

export const handler: SQSHandler = async (event): Promise<SQSBatchResponse> => {
  const batchItemFailures: SQSBatchItemFailure[] = [];

  for (const record of event.Records) {
    try {
      const paymentEvent = parsePaymentConfirmedEvent(record);

      if (paymentEvent.eventType !== PAYMENT_CONFIRMED_EVENT) {
        logInfo('Skipping unsupported event type.', {
          messageId: record.messageId,
          eventType: paymentEvent.eventType,
        });
        continue;
      }

      await sendPaymentConfirmationEmail(paymentEvent.payload);

      logInfo('Notification email sent.', {
        messageId: record.messageId,
        eventId: paymentEvent.eventId,
        orderId: paymentEvent.payload.orderId,
        paymentId: paymentEvent.payload.paymentId,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      logError('Failed to process SQS record.', {
        messageId: record.messageId,
        error: errorMessage,
      });

      batchItemFailures.push({
        itemIdentifier: record.messageId,
      });
    }
  }

  return {
    batchItemFailures,
  };
};
