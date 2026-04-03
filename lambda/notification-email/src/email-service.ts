import { Resend } from 'resend';
import {
  createHtmlBody,
  createPlainTextBody,
  createSubject,
} from './email-template';
import { OrderStatusEvent } from './types';

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.NOTIFICATION_EMAIL_FROM ?? 'onboarding@resend.dev';
const defaultToEmail = process.env.NOTIFICATION_DEFAULT_TO_EMAIL;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const sendOrderStatusEmail = async (
  event: OrderStatusEvent,
): Promise<void> => {
  if (!resend) {
    throw new Error('RESEND_API_KEY is not configured.');
  }

  const recipientEmail =
    event.payload.payment.recipientEmail?.trim() || defaultToEmail;

  if (!recipientEmail) {
    throw new Error(
      'NOTIFICATION_DEFAULT_TO_EMAIL is not configured and event has no recipientEmail.',
    );
  }

  await resend.emails.send({
    from: emailFrom,
    to: recipientEmail,
    subject: createSubject(event),
    text: createPlainTextBody(event),
    html: createHtmlBody(event),
  });
};
