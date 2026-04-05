export const requireNotificationResendApiKey = (resendApiKey?: string) => {
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is not configured.');
  }

  return resendApiKey;
};

export const requireNotificationRecipient = (recipient?: string) => {
  if (!recipient) {
    throw new Error(
      'NOTIFICATION_DEFAULT_TO_EMAIL is not configured and no recipientEmail was provided.',
    );
  }

  return recipient;
};
