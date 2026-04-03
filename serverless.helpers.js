function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function queueUrlToArn(queueUrl) {
  const match = queueUrl.match(
    /^https:\/\/sqs\.([a-z0-9-]+)\.amazonaws\.com\/([0-9]{12})\/(.+)$/,
  );

  if (!match) {
    throw new Error(
      'AWS_SQS_NOTIFICATION_PAYMENT_CONFIRMED_QUEUE_URL must be a valid AWS SQS URL.',
    );
  }

  const [, region, accountId, queueName] = match;

  return `arn:aws:sqs:${region}:${accountId}:${queueName}`;
}

module.exports = {
  notificationQueueArn: queueUrlToArn(
    getRequiredEnv('AWS_SQS_NOTIFICATION_PAYMENT_CONFIRMED_QUEUE_URL'),
  ),
};
