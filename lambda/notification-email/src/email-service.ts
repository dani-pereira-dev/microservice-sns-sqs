import { Resend } from 'resend';
import { createHtmlBody, createPlainTextBody } from './email-template';
import { PaymentConfirmation } from './types';

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.NOTIFICATION_EMAIL_FROM ?? 'onboarding@resend.dev';
const defaultToEmail = process.env.NOTIFICATION_DEFAULT_TO_EMAIL;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const sendPaymentConfirmationEmail = async (
  payment: PaymentConfirmation,
): Promise<void> => {
  if (!resend) {
    throw new Error('RESEND_API_KEY is not configured.');
  }

  const recipientEmail = payment.recipientEmail?.trim() || defaultToEmail;

  if (!recipientEmail) {
    throw new Error(
      'NOTIFICATION_DEFAULT_TO_EMAIL is not configured and event has no recipientEmail.',
    );
  }

  await resend.emails.send({
    from: emailFrom,
    to: recipientEmail,
    subject: `Pago confirmado para la orden ${payment.orderId}`,
    text: createPlainTextBody(payment),
    html: createHtmlBody(payment),
  });
};
