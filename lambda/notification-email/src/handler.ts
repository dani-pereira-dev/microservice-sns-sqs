import type {
  SQSBatchItemFailure,
  SQSBatchResponse,
  SQSHandler,
} from 'aws-lambda';
import { sendOrderStatusEmail } from './email-service';
import { parseOrderStatusEvent } from './event-parser';
import { logError, logInfo } from './logger';

export const handler: SQSHandler = async (event): Promise<SQSBatchResponse> => {
  const batchItemFailures: SQSBatchItemFailure[] = [];

  for (const record of event.Records) {
    try {
      const orderStatusEvent = parseOrderStatusEvent(record);
      await sendOrderStatusEmail(orderStatusEvent);

      logInfo('Notification email sent.', {
        messageId: record.messageId,
        eventId: orderStatusEvent.eventId,
        eventType: orderStatusEvent.eventType,
        orderId: orderStatusEvent.payload.orderId,
        paymentId: orderStatusEvent.payload.payment.paymentId,
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
