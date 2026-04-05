export const createNotificationConfigurationError = (message: string) =>
  new Error(message);

export const createUnsupportedNotificationEventError = () =>
  new Error('Unsupported order status event.');
