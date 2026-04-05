import { Injectable } from '@nestjs/common';
import { formatCartLog } from '@shared/logging/log-format.utils';
import { TaggedDomainLogger } from '@shared/logging/tagged-domain.logger';

@Injectable()
export class CartDomainLogger extends TaggedDomainLogger {
  constructor() {
    super(CartDomainLogger.name, formatCartLog);
  }
}
