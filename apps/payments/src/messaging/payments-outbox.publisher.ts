import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MESSAGE_PUBLISHER } from '@shared/messaging/messaging.constants';
import { MessagePublisher } from '@shared/messaging/messaging.interfaces';
import { PaymentsDomainLogger } from '../domain/logging/payments-domain.logger';
import { handlePaymentsOutboxPublishError } from './payments-outbox.error-handlers';
import { PaymentsOutboxRepository } from '../persistence/payments-outbox.repository';

@Injectable()
export class PaymentsOutboxPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly pollingIntervalInMs = 5000;
  private readonly batchSize = 10;
  private processing = false;
  private intervalHandle?: NodeJS.Timeout;

  constructor(
    @Inject(MESSAGE_PUBLISHER)
    private readonly messagePublisher: MessagePublisher,
    private readonly paymentsOutboxRepository: PaymentsOutboxRepository,
    private readonly paymentsDomainLogger: PaymentsDomainLogger,
  ) {}

  onModuleInit() {
    void this.publishPendingEvents();

    this.intervalHandle = setInterval(() => {
      void this.publishPendingEvents();
    }, this.pollingIntervalInMs);

    this.intervalHandle.unref?.();
  }

  onModuleDestroy() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }
  }

  async publishPendingEvents() {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      const pendingEvents = this.paymentsOutboxRepository.listPendingEvents(
        this.batchSize,
      );

      for (const pendingEvent of pendingEvents) {
        try {
          await this.messagePublisher.publish({
            topicArn: pendingEvent.topicArn,
            message: pendingEvent.message,
            attributes: pendingEvent.attributes,
          });

          this.paymentsOutboxRepository.markPublished(pendingEvent.eventId);
        } catch (error) {
          handlePaymentsOutboxPublishError({
            error,
            eventId: pendingEvent.eventId,
            domainLogger: this.paymentsDomainLogger,
            paymentsOutboxRepository: this.paymentsOutboxRepository,
          });
        }
      }
    } finally {
      this.processing = false;
    }
  }
}
