import Database from 'better-sqlite3';
import { Injectable } from '@nestjs/common';
import { PaymentConfirmedEvent } from '@shared/contracts/events';
import { PaymentsDatabase } from './payments-database';
import {
  OutboxEventRecord,
  OutboxEventRow,
  PendingOutboxEvent,
} from './payments.persistence.types';

@Injectable()
export class PaymentsOutboxRepository {
  constructor(private readonly paymentsDatabase: PaymentsDatabase) {}

  listOutboxEvents(): OutboxEventRecord[] {
    const rows = this.database
      .prepare(
        `
          SELECT
            event_id,
            topic_arn,
            message_json,
            attributes_json,
            status,
            attempts,
            last_error,
            created_at,
            published_at
          FROM payment_outbox
          ORDER BY created_at ASC
        `,
      )
      .all() as OutboxEventRow[];

    return rows.map((row) => this.mapRowToOutboxEvent(row));
  }

  listPendingEvents(limit = 10): PendingOutboxEvent[] {
    const rows = this.database
      .prepare(
        `
          SELECT
            event_id,
            topic_arn,
            message_json,
            attributes_json,
            status,
            attempts,
            last_error,
            created_at,
            published_at
          FROM payment_outbox
          WHERE status = 'pending'
          ORDER BY created_at ASC
          LIMIT ?
        `,
      )
      .all(limit) as OutboxEventRow[];

    return rows.map((row) => {
      const event = this.mapRowToOutboxEvent(row);

      return {
        eventId: event.eventId,
        topicArn: event.topicArn,
        message: event.message,
        attributes: event.attributes,
        attempts: event.attempts,
      };
    });
  }

  markPublished(eventId: string) {
    this.database
      .prepare(
        `
          UPDATE payment_outbox
          SET status = 'published',
              published_at = ?,
              last_error = NULL
          WHERE event_id = ?
        `,
      )
      .run(new Date().toISOString(), eventId);
  }

  markFailed(eventId: string, errorMessage: string) {
    this.database
      .prepare(
        `
          UPDATE payment_outbox
          SET attempts = attempts + 1,
              last_error = ?
          WHERE event_id = ?
        `,
      )
      .run(errorMessage, eventId);
  }

  private get database() {
    return this.paymentsDatabase.connection;
  }

  private mapRowToOutboxEvent(row: OutboxEventRow): OutboxEventRecord {
    return {
      eventId: row.event_id,
      topicArn: row.topic_arn,
      message: JSON.parse(row.message_json) as PaymentConfirmedEvent,
      attributes: row.attributes_json
        ? (JSON.parse(row.attributes_json) as Record<string, string>)
        : {},
      status: row.status,
      attempts: row.attempts,
      lastError: row.last_error,
      createdAt: row.created_at,
      publishedAt: row.published_at,
    };
  }
}
