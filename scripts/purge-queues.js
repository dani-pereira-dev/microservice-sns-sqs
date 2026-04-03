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

  await purgeQueue(sqsClient, ordersQueueUrl);
  await purgeQueue(sqsClient, notificationQueueUrl);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
