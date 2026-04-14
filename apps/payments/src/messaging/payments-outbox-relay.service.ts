import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MESSAGE_PUBLISHER } from "@shared/messaging/messaging.constants";
import { MessagePublisher } from "@shared/messaging/messaging.interfaces";
import { ServiceConfig } from "@shared/config/service-config.types";
import { PaymentsDomainLogger } from "../domain/logging/payments-domain.logger";
import { requirePaymentConfirmedTopicArn } from "../domain/validators/payments.domain.validators";
import {
  confirmationToPaymentConfirmedEvent,
  paymentRowToConfirmation,
  snsAttributesFromPaymentConfirmedEvent,
} from "../persistence/payments/payment-confirmed-event.builders";
import { PaymentsCommandRepository } from "../persistence/payments/payments-command.repository";
import { PaymentsQueryRepository } from "../persistence/payments/payments-query.repository";
import { handlePaymentsOutboxPublishError } from "./payments-outbox.error-handlers";

const OUTBOX_BATCH_SIZE = 10;
const OUTBOX_POLL_MS = 5000;

/**
 * Reintenta publicación a SNS de pagos con `published_at` null (mismo rol que `ProductsOutboxRelayService`).
 */
@Injectable()
export class PaymentsOutboxRelayService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private flushInProgress = false;

  constructor(
    @Inject(MESSAGE_PUBLISHER)
    private readonly messagePublisher: MessagePublisher,
    private readonly config: ConfigService<ServiceConfig, true>,
    private readonly paymentsQueryRepository: PaymentsQueryRepository,
    private readonly paymentsCommandRepository: PaymentsCommandRepository,
    private readonly paymentsDomainLogger: PaymentsDomainLogger,
  ) {}

  onModuleInit(): void {
    void this.flushPendingOutbox();

    this.timer = setInterval(() => {
      void this.flushPendingOutbox();
    }, OUTBOX_POLL_MS);

    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async flushPendingOutbox(): Promise<void> {
    if (this.flushInProgress) {
      return;
    }

    this.flushInProgress = true;

    try {
      const topicArn = requirePaymentConfirmedTopicArn(
        this.config.get("messaging.paymentConfirmedTopicArn", {
          infer: true,
        }),
      );

      const pending = await this.paymentsQueryRepository.findPendingOutbox(
        OUTBOX_BATCH_SIZE,
      );

      for (const row of pending) {
        try {
          const confirmation = paymentRowToConfirmation(row);
          const message = confirmationToPaymentConfirmedEvent(confirmation);
          const attributes = snsAttributesFromPaymentConfirmedEvent(message);

          await this.messagePublisher.publish({
            topicArn,
            message,
            attributes,
          });

          await this.paymentsCommandRepository.markPublished(row.paymentId);
        } catch (error) {
          await handlePaymentsOutboxPublishError({
            error,
            paymentId: row.paymentId,
            domainLogger: this.paymentsDomainLogger,
          });
          break;
        }
      }
    } finally {
      this.flushInProgress = false;
    }
  }
}
