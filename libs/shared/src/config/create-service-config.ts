import { ServiceConfig } from './service-config.types';

function toEnvKey(serviceName: string) {
  return serviceName.replace(/-/g, '_').toUpperCase();
}

function readPort(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const port = Number(value);

  return Number.isInteger(port) && port > 0 ? port : fallback;
}

function readPositiveIntMs(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n < 500) {
    return fallback;
  }
  return Math.min(n, 900_000);
}

export function createServiceConfig(
  serviceName: string,
  defaultPort: number,
): ServiceConfig {
  const envKeyPrefix = toEnvKey(serviceName);

  return {
    app: {
      name: serviceName,
      env: process.env.NODE_ENV ?? 'development',
      port: readPort(
        process.env[`${envKeyPrefix}_PORT`] ?? process.env.PORT,
        defaultPort,
      ),
    },
    messaging: {
      transport: 'sns-sqs',
      region: process.env.AWS_REGION ?? 'us-east-1',
      endpoint: process.env.AWS_ENDPOINT,
      checkoutInitiatedTopicArn:
        process.env.AWS_SNS_CHECKOUT_INITIATED_TOPIC_ARN,
      orderCreatedTopicArn: process.env.AWS_SNS_ORDER_CREATED_TOPIC_ARN,
      paymentConfirmedTopicArn: process.env.AWS_SNS_PAYMENT_CONFIRMED_TOPIC_ARN,
      orderStatusTopicArn: process.env.AWS_SNS_ORDER_STATUS_TOPIC_ARN,
      productEventsTopicArn: process.env.AWS_SNS_PRODUCT_EVENTS_TOPIC_ARN,
      ordersCheckoutInitiatedQueueUrl:
        process.env.AWS_SQS_ORDERS_CHECKOUT_INITIATED_QUEUE_URL,
      paymentsOrderCreatedQueueUrl:
        process.env.AWS_SQS_PAYMENTS_ORDER_CREATED_QUEUE_URL,
      ordersPaymentConfirmedQueueUrl:
        process.env.AWS_SQS_ORDERS_PAYMENT_CONFIRMED_QUEUE_URL,
      notificationOrderStatusQueueUrl:
        process.env.AWS_SQS_NOTIFICATION_ORDER_STATUS_QUEUE_URL,
      cartProductEventsQueueUrl:
        process.env.AWS_SQS_CART_PRODUCT_EVENTS_QUEUE_URL,
      productsProjectionQueueUrl:
        process.env.AWS_SQS_PRODUCTS_PROJECTION_QUEUE_URL,
    },
    database: {
      ordersDbPath: process.env.ORDERS_DB_PATH ?? 'data/orders.sqlite',
      paymentsDbPath: process.env.PAYMENTS_DB_PATH ?? 'data/payments.sqlite',
      cartDbPath: process.env.CART_DB_PATH ?? 'data/cart.sqlite',
      productsDatabaseUrl: process.env.PRODUCTS_DATABASE_URL,
      productsTypeormSynchronize:
        process.env.PRODUCTS_TYPEORM_SYNCHRONIZE === 'true',
      productsDatabaseSslRejectUnauthorized:
        process.env.PRODUCTS_DATABASE_SSL_REJECT_UNAUTHORIZED === 'true',
      productsOutboxPollMs: readPositiveIntMs(
        process.env.PRODUCTS_OUTBOX_POLL_MS,
        5000,
      ),
      productsProjectionTableName: process.env.PRODUCTS_PROJECTION_TABLE_NAME,
      paymentsDatabaseUrl: process.env.PAYMENTS_DATABASE_URL,
      paymentsDatabaseSslRejectUnauthorized:
        process.env.PAYMENTS_DATABASE_SSL_REJECT_UNAUTHORIZED === 'true',
      paymentsTypeormSynchronize:
        process.env.PAYMENTS_TYPEORM_SYNCHRONIZE === 'true',
    },
    notification: {
      resendApiKey: process.env.RESEND_API_KEY,
      emailFrom: process.env.NOTIFICATION_EMAIL_FROM ?? 'onboarding@resend.dev',
      defaultToEmail: process.env.NOTIFICATION_DEFAULT_TO_EMAIL,
    },
  };
}
