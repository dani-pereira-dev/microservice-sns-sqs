import { Injectable } from '@nestjs/common';
import { formatPaymentsLog } from '@shared/logging/log-format.utils';
import { TaggedDomainLogger } from '@shared/logging/tagged-domain.logger';

@Injectable()
export class PaymentsDomainLogger extends TaggedDomainLogger {
  constructor() {
    super(PaymentsDomainLogger.name, formatPaymentsLog);
  }
}
