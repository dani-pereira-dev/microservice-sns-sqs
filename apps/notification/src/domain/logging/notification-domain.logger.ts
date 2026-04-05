import { Injectable } from '@nestjs/common';
import { formatNotificationLog } from '@shared/logging/log-format.utils';
import { TaggedDomainLogger } from '@shared/logging/tagged-domain.logger';

@Injectable()
export class NotificationDomainLogger extends TaggedDomainLogger {
  constructor() {
    super(NotificationDomainLogger.name, formatNotificationLog);
  }
}
