import { PaymentsDomainLogger } from '../domain/logging/payments-domain.logger';
import { PaymentsOutboxRepository } from '../persistence/payments-outbox.repository';

export const handlePaymentsOutboxPublishError = ({
  error,
  eventId,
  domainLogger,
  paymentsOutboxRepository,
}: {
  error: unknown;
  eventId: string;
  domainLogger: PaymentsDomainLogger;
  paymentsOutboxRepository: PaymentsOutboxRepository;
}) => {
  const errorMessage = error instanceof Error ? error.message : String(error);

  paymentsOutboxRepository.markFailed(eventId, errorMessage);

  domainLogger.error(
    `Failed to publish outbox event ${eventId}.`,
    error instanceof Error ? error.stack : errorMessage,
  );
};
