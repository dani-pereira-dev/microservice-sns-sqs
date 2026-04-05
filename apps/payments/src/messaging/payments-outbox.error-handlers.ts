import { Logger } from '@nestjs/common';
import { PaymentsOutboxRepository } from '../persistence/payments-outbox.repository';

export const handlePaymentsOutboxPublishError = ({
  error,
  eventId,
  logger,
  paymentsOutboxRepository,
}: {
  error: unknown;
  eventId: string;
  logger: Logger;
  paymentsOutboxRepository: PaymentsOutboxRepository;
}) => {
  const errorMessage = error instanceof Error ? error.message : String(error);

  paymentsOutboxRepository.markFailed(eventId, errorMessage);

  logger.error(
    `Failed to publish outbox event ${eventId}.`,
    error instanceof Error ? error.stack : errorMessage,
  );
};
