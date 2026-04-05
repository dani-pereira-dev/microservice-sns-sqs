import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { MESSAGE_PUBLISHER } from '@shared/messaging/messaging.constants';
import { MessagePublisher } from '@shared/messaging/messaging.interfaces';
import { PaymentsOutboxRepository } from '../persistence/payments-outbox.repository';

@Injectable()
export class PaymentsOutboxPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentsOutboxPublisher.name);
  private readonly pollingIntervalInMs = 5000;
  private readonly batchSize = 10;
  private processing = false;
  private intervalHandle?: NodeJS.Timeout;

  constructor(
    @Inject(MESSAGE_PUBLISHER)
    private readonly messagePublisher: MessagePublisher,
    private readonly paymentsOutboxRepository: PaymentsOutboxRepository,
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
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          this.paymentsOutboxRepository.markFailed(
            pendingEvent.eventId,
            errorMessage,
          );

          this.logger.error(
            `Failed to publish outbox event ${pendingEvent.eventId}.`,
            error instanceof Error ? error.stack : errorMessage,
          );
        }
      }
    } finally {
      this.processing = false;
    }
  }
}
