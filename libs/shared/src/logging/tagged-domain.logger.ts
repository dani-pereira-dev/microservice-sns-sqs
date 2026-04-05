import { Injectable, Logger } from '@nestjs/common';

export type DomainLogFormatter = (message: string) => string;

@Injectable()
export abstract class TaggedDomainLogger {
  private readonly logger: Logger;

  protected constructor(
    context: string,
    private readonly formatMessage: DomainLogFormatter,
  ) {
    this.logger = new Logger(context);
  }

  log(message: string) {
    this.logger.log(this.formatMessage(message));
  }

  warn(message: string) {
    this.logger.warn(this.formatMessage(message));
  }

  error(message: string, trace?: string) {
    this.logger.error(this.formatMessage(message), trace);
  }
}
