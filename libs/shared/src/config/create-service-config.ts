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
      paymentConfirmedTopicArn: process.env.AWS_SNS_PAYMENT_CONFIRMED_TOPIC_ARN,
      orderStatusTopicArn: process.env.AWS_SNS_ORDER_STATUS_TOPIC_ARN,
      ordersPaymentConfirmedQueueUrl:
        process.env.AWS_SQS_ORDERS_PAYMENT_CONFIRMED_QUEUE_URL,
      notificationOrderStatusQueueUrl:
        process.env.AWS_SQS_NOTIFICATION_ORDER_STATUS_QUEUE_URL,
    },
    database: {
      ordersDbPath: process.env.ORDERS_DB_PATH ?? 'data/orders.sqlite',
      paymentsDbPath: process.env.PAYMENTS_DB_PATH ?? 'data/payments.sqlite',
      productsDbPath: process.env.PRODUCTS_DB_PATH ?? 'data/products.sqlite',
      cartDbPath: process.env.CART_DB_PATH ?? 'data/cart.sqlite',
    },
    dependencies: {
      ordersBaseUrl: process.env.ORDERS_BASE_URL ?? 'http://localhost:3001',
    },
    notification: {
      resendApiKey: process.env.RESEND_API_KEY,
      emailFrom: process.env.NOTIFICATION_EMAIL_FROM ?? 'onboarding@resend.dev',
      defaultToEmail: process.env.NOTIFICATION_DEFAULT_TO_EMAIL,
    },
  };
}
