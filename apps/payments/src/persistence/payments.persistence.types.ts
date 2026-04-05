import { PaymentConfirmedEvent } from '@shared/contracts/events';

export interface PaymentRow {
  idempotency_key: string;
  payment_id: string;
  order_id: string;
  amount: number;
  payment_method: string;
  status: 'confirmed';
  confirmed_at: string;
}

export interface OutboxEventRow {
  event_id: string;
  topic_arn: string;
  message_json: string;
  attributes_json: string | null;
  status: 'pending' | 'published';
  attempts: number;
  last_error: string | null;
  created_at: string;
  published_at: string | null;
}

export interface PendingOutboxEvent {
  eventId: string;
  topicArn: string;
  message: PaymentConfirmedEvent;
  attributes: Record<string, string>;
  attempts: number;
}

export interface OutboxEventRecord {
  eventId: string;
  topicArn: string;
  message: PaymentConfirmedEvent;
  attributes: Record<string, string>;
  status: 'pending' | 'published';
  attempts: number;
  lastError: string | null;
  createdAt: string;
  publishedAt: string | null;
}
