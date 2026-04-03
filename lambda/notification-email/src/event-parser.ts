import type { SQSRecord } from 'aws-lambda';
import {
  ORDER_CONFIRMED_EVENT,
  ORDER_CONFIRMATION_FAILED_EVENT,
  OrderStatusEvent,
  SnsEnvelope,
} from './types';

export const parseOrderStatusEvent = (record: SQSRecord): OrderStatusEvent => {
  const body = parseJson(record.body, 'SQS body');

  if (isOrderStatusEvent(body)) {
    return body;
  }

  if (isSnsEnvelope(body) && body.Message) {
    const snsMessage = parseJson(body.Message, 'SNS message');

    if (isOrderStatusEvent(snsMessage)) {
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

const isOrderStatusEvent = (value: unknown): value is OrderStatusEvent => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<OrderStatusEvent>;

  return (
    (candidate.eventType === ORDER_CONFIRMED_EVENT ||
      candidate.eventType === ORDER_CONFIRMATION_FAILED_EVENT) &&
    typeof candidate.eventId === 'string' &&
    typeof candidate.occurredAt === 'string' &&
    typeof candidate.source === 'string' &&
    typeof candidate.payload === 'object' &&
    candidate.payload !== null
  );
};
