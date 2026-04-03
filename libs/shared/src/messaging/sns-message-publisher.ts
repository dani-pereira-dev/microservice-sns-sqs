import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { ServiceConfig } from '@shared/config/service-config.types';
import { MESSAGING_OPTIONS } from './messaging.constants';
import {
  MessagePublisher,
  MessagingModuleOptions,
  PublishMessage,
} from './messaging.interfaces';
import { formatSnsLog } from './messaging-log.utils';

@Injectable()
export class SnsMessagePublisher implements MessagePublisher {
  private readonly logger = new Logger(SnsMessagePublisher.name);
  private readonly snsClient: SNSClient;

  constructor(
    @Inject(MESSAGING_OPTIONS)
    private readonly options: MessagingModuleOptions,
    private readonly configService: ConfigService<ServiceConfig, true>,
  ) {
    const messagingConfig = this.configService.get('messaging', { infer: true });

    this.snsClient = new SNSClient({
      region: messagingConfig.region,
      endpoint: messagingConfig.endpoint || undefined,
    });
  }

  async publish<TPayload>(message: PublishMessage<TPayload>): Promise<void> {
    await this.snsClient.send(
      new PublishCommand({
        TopicArn: message.topicArn,
        Message: JSON.stringify(message.message),
        MessageAttributes: this.mapAttributes(message.attributes),
      }),
    );

    this.logger.log(
      formatSnsLog(
        `Published message to SNS topic for ${this.options.serviceName}.`,
      ),
    );
  }

  private mapAttributes(attributes?: Record<string, string>) {
    if (!attributes) {
      return undefined;
    }

    return Object.fromEntries(
      Object.entries(attributes).map(([key, value]) => [
        key,
        {
          DataType: 'String',
          StringValue: value,
        },
      ]),
    );
  }
}
