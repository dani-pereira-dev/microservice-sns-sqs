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
  productEventsTopicArn?: string;
  ordersCheckoutInitiatedQueueUrl?: string;
  paymentsOrderCreatedQueueUrl?: string;
  ordersPaymentConfirmedQueueUrl?: string;
  notificationOrderStatusQueueUrl?: string;
  cartProductEventsQueueUrl?: string;
}

export interface ServiceDatabaseConfig {
  ordersDbPath: string;
  paymentsDbPath: string;
  cartDbPath: string;
  /** URL postgres del event store de products (instancia en AWS). */
  productsDatabaseUrl?: string;
  /** Si true, TypeORM sincroniza el esquema (solo desarrollo). */
  productsTypeormSynchronize: boolean;
  /**
   * Si true, TLS exige cadena de certificados confiable para Node (producción con CA de RDS).
   * Si false (por defecto), `ssl.rejectUnauthorized` es false: evita el error típico desde laptop contra Postgres en AWS.
   */
  productsDatabaseSslRejectUnauthorized: boolean;
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
