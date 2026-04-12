import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '@shared/contracts/products';
import { Repository } from 'typeorm';
import { ProductEvent } from './entities/product-event.entity';

@Injectable()
export class ProductEventsRepository {
  constructor(
    @InjectRepository(ProductEvent)
    private readonly events: Repository<ProductEvent>,
  ) {}

  async getNextVersion(aggregateId: string): Promise<number> {
    const row = await this.events
      .createQueryBuilder('e')
      .select('MAX(e.version)', 'max')
      .where('e.aggregateId = :aggregateId', { aggregateId })
      .getRawOne<{ max: string | null }>();

    const max = row?.max != null ? Number(row.max) : 0;
    return max + 1;
  }

  async append(params: {
    aggregateId: string;
    type: string;
    payload: Partial<Product>;
    version: number;
  }): Promise<ProductEvent> {
    const row = this.events.create({
      aggregateId: params.aggregateId,
      type: params.type,
      payload: params.payload,
      version: params.version,
    });
    return this.events.save(row);
  }

  /**
   * Último evento por agregado; el payload de lifecycle lleva el Product completo.
   */
  async findProductById(productId: string): Promise<Product | null> {
    const latest = await this.events.findOne({
      where: { aggregateId: productId },
      order: { version: 'DESC' },
    });

    if (!latest) {
      return null;
    }

    return latest.payload as Product;
  }

  async listProducts(): Promise<Product[]> {
    const latest = await this.events
      .createQueryBuilder('e')
      .distinctOn(['e.aggregateId'])
      .orderBy('e.aggregateId', 'ASC')
      .addOrderBy('e.version', 'DESC')
      .getMany();

    const products = latest.map((row) => row.payload as Product);
    products.sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt, undefined, { numeric: true }),
    );
    return products;
  }
}
