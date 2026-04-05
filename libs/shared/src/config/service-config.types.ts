export interface ServiceAppConfig {
  name: string;
  env: string;
  port: number;
}

export interface ServiceMessagingConfig {
  transport: 'sns-sqs';
  region: string;
  endpoint?: string;
  checkoutInitiatedTopicArn?: string;
  orderCreatedTopicArn?: string;
  paymentConfirmedTopicArn?: string;
  orderStatusTopicArn?: string;
  ordersCheckoutInitiatedQueueUrl?: string;
  paymentsOrderCreatedQueueUrl?: string;
  ordersPaymentConfirmedQueueUrl?: string;
  notificationOrderStatusQueueUrl?: string;
}

export interface ServiceDatabaseConfig {
  ordersDbPath: string;
  paymentsDbPath: string;
  productsDbPath: string;
  cartDbPath: string;
}

export interface ServiceNotificationConfig {
  resendApiKey?: string;
  emailFrom: string;
  defaultToEmail?: string;
}

export interface ServiceConfig {
  app: ServiceAppConfig;
  messaging: ServiceMessagingConfig;
  database: ServiceDatabaseConfig;
  notification: ServiceNotificationConfig;
}
