import { setTimeout as sleep } from 'node:timers/promises';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import {
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';
import { ServiceConfig } from '@shared/config/service-config.types';
import {
  ConsumedMessageMetadata,
  MessageConsumer,
  SubscribeMessage,
} from './messaging.interfaces';
import { formatSqsLog } from '../logging/log-format.utils';

interface ActiveSubscription {
  stopped: boolean;
  promise: Promise<void>;
}

@Injectable()
export class SqsMessageConsumer implements MessageConsumer, OnModuleDestroy {
  private readonly logger = new Logger(SqsMessageConsumer.name);
  private readonly sqsClient: SQSClient;
  private readonly subscriptions: ActiveSubscription[] = [];

  constructor(
    private readonly configService: ConfigService<ServiceConfig, true>,
  ) {
    const messagingConfig = this.configService.get('messaging', { infer: true });

    this.sqsClient = new SQSClient({
      region: messagingConfig.region,
      endpoint: messagingConfig.endpoint || undefined,
    });
  }

  async subscribe<TPayload>(
    subscription: SubscribeMessage<TPayload>,
  ): Promise<void> {
    const activeSubscription: ActiveSubscription = {
      stopped: false,
      promise: Promise.resolve(),
    };

    activeSubscription.promise = this.pollQueue(subscription, activeSubscription);
    this.subscriptions.push(activeSubscription);

    activeSubscription.promise.catch((error: unknown) => {
      this.logger.error(
        formatSqsLog(`Polling stopped for ${subscription.handlerName}.`),
        error instanceof Error ? error.stack : String(error),
      );
    });
  }

  async shutdown(): Promise<void> {
    for (const subscription of this.subscriptions) {
      subscription.stopped = true;
    }

    await Promise.allSettled(this.subscriptions.map((item) => item.promise));
  }

  async onModuleDestroy(): Promise<void> {
    await this.shutdown();
  }

  private async pollQueue<TPayload>(
    subscription: SubscribeMessage<TPayload>,
    activeSubscription: ActiveSubscription,
  ): Promise<void> {
    this.logger.log(
      formatSqsLog(
        `Started SQS polling for ${subscription.handlerName} on ${subscription.queueUrl}.`,
      ),
    );

    while (!activeSubscription.stopped) {
      try {
        const response = await this.sqsClient.send(
          new ReceiveMessageCommand({
            QueueUrl: subscription.queueUrl,
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: 20,
            AttributeNames: ['All'],
            MessageAttributeNames: ['All'],
          }),
        );

        for (const message of response.Messages ?? []) {
          await this.handleMessage(subscription, message);
        }
      } catch (error) {
        this.logger.error(
          formatSqsLog(
            `Error while polling ${subscription.handlerName}. Retrying...`,
          ),
          error instanceof Error ? error.stack : String(error),
        );
        await sleep(1000);
      }
    }
  }

  private async handleMessage<TPayload>(
    subscription: SubscribeMessage<TPayload>,
    message: Message,
  ) {
    const payload = this.extractPayload<TPayload>(message);
    const metadata: ConsumedMessageMetadata = {
      messageId: message.MessageId,
      receiptHandle: message.ReceiptHandle,
    };

    await subscription.handleMessage(payload, metadata);

    if (message.ReceiptHandle) {
      await this.sqsClient.send(
        new DeleteMessageCommand({
          QueueUrl: subscription.queueUrl,
          ReceiptHandle: message.ReceiptHandle,
        }),
      );
    }
  }

  private extractPayload<TPayload>(message: Message): TPayload {
    if (!message.Body) {
      throw new Error('SQS message body is empty.');
    }

    const parsedBody = JSON.parse(message.Body) as {
      Message?: string;
    };

    if (typeof parsedBody.Message === 'string') {
      return JSON.parse(parsedBody.Message) as TPayload;
    }

    return parsedBody as TPayload;
  }
}
