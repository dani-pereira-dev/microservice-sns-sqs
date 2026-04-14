import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('payments')
@Index('idx_payments_order_id', ['orderId'])
export class Payment {
  @Column({ name: 'idempotency_key', type: 'text', nullable: true })
  idempotencyKey!: string | null;

  @PrimaryColumn({ name: 'payment_id', type: 'text' })
  paymentId!: string;

  @Column({ name: 'order_id', type: 'text' })
  orderId!: string;

  @Column({ type: 'double precision' })
  amount!: number;

  @Column({ name: 'payment_method', type: 'text' })
  paymentMethod!: string;

  @Column({ type: 'text' })
  status!: string;

  @Column({ name: 'confirmed_at', type: 'text' })
  confirmedAt!: string;

  /** Null hasta publicar en SNS (mismo criterio que `product_events.published_at`). */
  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;
}
