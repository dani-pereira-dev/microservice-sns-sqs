const { PurgeQueueCommand, SQSClient } = require('@aws-sdk/client-sqs');
const { loadLocalEnvironment } = require('./load-env');

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

async function purgeQueue(sqsClient, queueUrl) {
  await sqsClient.send(
    new PurgeQueueCommand({
      QueueUrl: queueUrl,
    }),
  );

  console.log(`purged ${queueUrl}`);
}

async function main() {
  loadLocalEnvironment();

  const region = process.env.AWS_REGION || 'us-east-1';
  const endpoint = process.env.AWS_ENDPOINT || undefined;
  const ordersCheckoutQueueUrl = getRequiredEnv(
    'AWS_SQS_ORDERS_CHECKOUT_INITIATED_QUEUE_URL',
  );
  const paymentsOrderCreatedQueueUrl = getRequiredEnv(
    'AWS_SQS_PAYMENTS_ORDER_CREATED_QUEUE_URL',
  );
  const ordersQueueUrl = getRequiredEnv(
    'AWS_SQS_ORDERS_PAYMENT_CONFIRMED_QUEUE_URL',
  );
  const notificationQueueUrl = getRequiredEnv(
    'AWS_SQS_NOTIFICATION_ORDER_STATUS_QUEUE_URL',
  );

  const sqsClient = new SQSClient({
    region,
    endpoint,
  });

  await purgeQueue(sqsClient, ordersCheckoutQueueUrl);
  await purgeQueue(sqsClient, paymentsOrderCreatedQueueUrl);
  await purgeQueue(sqsClient, ordersQueueUrl);
  await purgeQueue(sqsClient, notificationQueueUrl);

  const cartProductEventsQueueUrl =
    process.env.AWS_SQS_CART_PRODUCT_EVENTS_QUEUE_URL;
  if (cartProductEventsQueueUrl) {
    await purgeQueue(sqsClient, cartProductEventsQueueUrl);
  } else {
    console.log(
      'skip purge: AWS_SQS_CART_PRODUCT_EVENTS_QUEUE_URL is not set',
    );
  }

  const productsProjectionQueueUrl =
    process.env.AWS_SQS_PRODUCTS_PROJECTION_QUEUE_URL;
  if (productsProjectionQueueUrl) {
    await purgeQueue(sqsClient, productsProjectionQueueUrl);
  } else {
    console.log(
      'skip purge: AWS_SQS_PRODUCTS_PROJECTION_QUEUE_URL is not set',
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
