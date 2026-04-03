import { DynamicModule, Global, Module } from '@nestjs/common';
import {
  MESSAGE_CONSUMER,
  MESSAGE_PUBLISHER,
  MESSAGING_OPTIONS,
} from './messaging.constants';
import { MessagingModuleOptions } from './messaging.interfaces';
import { SnsMessagePublisher } from './sns-message-publisher';
import { SqsMessageConsumer } from './sqs-message-consumer';

@Global()
@Module({})
export class MessagingModule {
  static register(options: MessagingModuleOptions): DynamicModule {
    return {
      module: MessagingModule,
      providers: [
        {
          provide: MESSAGING_OPTIONS,
          useValue: options,
        },
        SnsMessagePublisher,
        SqsMessageConsumer,
        {
          provide: MESSAGE_PUBLISHER,
          useExisting: SnsMessagePublisher,
        },
        {
          provide: MESSAGE_CONSUMER,
          useExisting: SqsMessageConsumer,
        },
      ],
      exports: [MESSAGE_PUBLISHER, MESSAGE_CONSUMER],
    };
  }
}
