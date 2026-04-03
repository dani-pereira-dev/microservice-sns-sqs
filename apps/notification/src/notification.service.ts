import { Injectable, Logger } from "@nestjs/common";
import { PaymentConfirmation } from "@shared/contracts/payments";
import { formatNotificationLog } from "@shared/messaging/messaging-log.utils";

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  handlePaymentConfirmed(payment: PaymentConfirmation) {
    this.logger.log(
      formatNotificationLog(
        `Placeholder received payment ${payment.paymentId} for order ${payment.orderId}.`,
      ),
    );
  }
}
