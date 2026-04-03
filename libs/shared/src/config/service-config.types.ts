export interface ServiceAppConfig {
  name: string;
  env: string;
  port: number;
}

export interface ServiceMessagingConfig {
  transport: 'sns-sqs';
  region: string;
  endpoint?: string;
  paymentConfirmedTopicArn?: string;
  ordersPaymentConfirmedQueueUrl?: string;
  notificationPaymentConfirmedQueueUrl?: string;
}

export interface ServiceDatabaseConfig {
  ordersDbPath: string;
  paymentsDbPath: string;
  productsDbPath: string;
  cartDbPath: string;
}

export interface ServiceDependenciesConfig {
  ordersBaseUrl: string;
  productsBaseUrl: string;
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
  dependencies: ServiceDependenciesConfig;
  notification: ServiceNotificationConfig;
}
