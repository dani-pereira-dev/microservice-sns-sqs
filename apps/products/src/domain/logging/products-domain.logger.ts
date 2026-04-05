import { Injectable } from '@nestjs/common';
import { formatProductsLog } from '@shared/logging/log-format.utils';
import { TaggedDomainLogger } from '@shared/logging/tagged-domain.logger';

@Injectable()
export class ProductsDomainLogger extends TaggedDomainLogger {
  constructor() {
    super(ProductsDomainLogger.name, formatProductsLog);
  }
}
