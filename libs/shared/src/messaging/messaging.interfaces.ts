export interface PublishMessage<TPayload = unknown> {
  topicArn: string;
  message: TPayload;
  attributes?: Record<string, string>;
}

export interface ConsumedMessageMetadata {
  messageId?: string;
  receiptHandle?: string;
}

export interface SubscribeMessage<TPayload = unknown> {
  queueUrl: string;
  handlerName: string;
  handleMessage: (
    payload: TPayload,
    metadata: ConsumedMessageMetadata,
  ) => Promise<void>;
}

export interface MessagePublisher {
  publish<TPayload>(message: PublishMessage<TPayload>): Promise<void>;
}

export interface MessageConsumer {
  subscribe<TPayload>(message: SubscribeMessage<TPayload>): Promise<void>;
  shutdown(): Promise<void>;
}

export interface MessagingModuleOptions {
  serviceName: string;
}
