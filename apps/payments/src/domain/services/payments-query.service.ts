import { Injectable } from '@nestjs/common';
import { PaymentsOutboxRepository } from '../../persistence/payments-outbox.repository';
import { PaymentsRepository } from '../../persistence/payments.repository';
import { requireExistingPayment } from '../validators/payments.domain.validators';

@Injectable()
export class PaymentsQueryService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly paymentsOutboxRepository: PaymentsOutboxRepository,
  ) {}

  listPayments() {
    return this.paymentsRepository.list();
  }

  listOutboxEvents() {
    return this.paymentsOutboxRepository.listOutboxEvents();
  }

  getPaymentById(paymentId: string) {
    return requireExistingPayment(
      this.paymentsRepository.findByPaymentId(paymentId),
      paymentId,
    );
  }
}
