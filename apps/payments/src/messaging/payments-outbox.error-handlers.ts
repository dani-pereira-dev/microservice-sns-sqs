import { PaymentsDomainLogger } from '../domain/logging/payments-domain.logger';

export const handlePaymentsOutboxPublishError = async ({
  error,
  paymentId,
  domainLogger,
}: {
  error: unknown;
  paymentId: string;
  domainLogger: PaymentsDomainLogger;
}) => {
  const errorMessage = error instanceof Error ? error.message : String(error);

  domainLogger.error(
    `Failed to publish payment outbox for ${paymentId}.`,
    error instanceof Error ? error.stack : errorMessage,
  );
};
