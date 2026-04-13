import { Product } from '@shared/contracts/products';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('product_events')
@Unique('uq_product_events_aggregate_version', ['aggregateId', 'version'])
export class ProductEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'aggregate_id', type: 'text' })
  aggregateId!: string;

  @Column({ name: 'type', type: 'text' })
  type!: string;

  @Column({ type: 'jsonb' })
  payload!: Partial<Product>;

  @Column({ type: 'int' })
  version!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  /** Null hasta publicar en SNS (outbox); seteado tras envío exitoso. */
  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt?: Date | null;
}
