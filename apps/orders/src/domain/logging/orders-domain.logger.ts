import { Injectable } from '@nestjs/common';
import { formatOrdersLog } from '@shared/logging/log-format.utils';
import { TaggedDomainLogger } from '@shared/logging/tagged-domain.logger';

@Injectable()
export class OrdersDomainLogger extends TaggedDomainLogger {
  constructor() {
    super(OrdersDomainLogger.name, formatOrdersLog);
  }
}
