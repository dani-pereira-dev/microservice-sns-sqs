import type { SQSRecord } from 'aws-lambda';
import {
  PAYMENT_CONFIRMED_EVENT,
  PaymentConfirmedEvent,
  SnsEnvelope,
} from './types';

export const parsePaymentConfirmedEvent = (
  record: SQSRecord,
): PaymentConfirmedEvent => {
  const body = parseJson(record.body, 'SQS body');

  if (isPaymentConfirmedEvent(body)) {
    return body;
  }

  if (isSnsEnvelope(body) && body.Message) {
    const snsMessage = parseJson(body.Message, 'SNS message');

    if (isPaymentConfirmedEvent(snsMessage)) {
      return snsMessage;
    }
  }

  throw new Error('Unsupported SQS payload received by notification lambda.');
};

const parseJson = <TValue>(rawValue: string, label: string): TValue => {
  try {
    return JSON.parse(rawValue) as TValue;
  } catch {
    throw new Error(`Invalid JSON in ${label}.`);
  }
};

const isSnsEnvelope = (value: unknown): value is SnsEnvelope =>
  typeof value === 'object' && value !== null && 'Message' in value;

const isPaymentConfirmedEvent = (
  value: unknown,
): value is PaymentConfirmedEvent => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<PaymentConfirmedEvent>;

  return (
    candidate.eventType === PAYMENT_CONFIRMED_EVENT &&
    typeof candidate.eventId === 'string' &&
    typeof candidate.occurredAt === 'string' &&
    typeof candidate.source === 'string' &&
    typeof candidate.payload === 'object' &&
    candidate.payload !== null
  );
};
