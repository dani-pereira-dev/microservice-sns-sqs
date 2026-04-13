import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DynamoDBDocumentClient,
  GetCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { Product } from '@shared/contracts/products';
import { ServiceConfig } from '@shared/config/service-config.types';
import { PRODUCTS_PROJECTION_DYNAMODB_DOCUMENT_CLIENT } from './products-projection-dynamo.constants';

/**
 * Proyección de productos en DynamoDB (PK string `id`).
 * Atributos por ítem: id, title, price, active, createdAt, updatedAt (mismo shape que {@link Product}).
 */
@Injectable()
export class ProductProjectionRepository {
  constructor(
    @Inject(PRODUCTS_PROJECTION_DYNAMODB_DOCUMENT_CLIENT)
    private readonly documentClient: DynamoDBDocumentClient,
    private readonly config: ConfigService<ServiceConfig, true>,
  ) {}

  get tableName(): string | undefined {
    const name = this.config.get('database.productsProjectionTableName', {
      infer: true,
    });
    return name?.trim() || undefined;
  }

  async findProductById(id: string): Promise<Product | null> {
    const table = this.requireTable();
    const out = await this.documentClient.send(
      new GetCommand({ TableName: table, Key: { id } }),
    );
    if (!out.Item) {
      return null;
    }
    return this.mapItemToProduct(out.Item as Record<string, unknown>);
  }

  async listProducts(): Promise<Product[]> {
    const table = this.requireTable();
    const rows: Product[] = [];
    let startKey: Record<string, unknown> | undefined;

    do {
      const out = await this.documentClient.send(
        new ScanCommand({
          TableName: table,
          ExclusiveStartKey: startKey,
        }),
      );
      for (const item of out.Items ?? []) {
        rows.push(this.mapItemToProduct(item as Record<string, unknown>));
      }
      startKey = out.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (startKey);

    rows.sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt, undefined, { numeric: true }),
    );
    return rows;
  }

  private requireTable(): string {
    const name = this.tableName;
    if (!name) {
      throw new Error(
        'PRODUCTS_PROJECTION_TABLE_NAME no está definida; no se pueden leer productos desde DynamoDB.',
      );
    }
    return name;
  }

  private mapItemToProduct(item: Record<string, unknown>): Product {
    return {
      id: String(item.id),
      title: String(item.title),
      price: Number(item.price),
      active: Boolean(item.active),
      createdAt: String(item.createdAt),
      updatedAt: String(item.updatedAt),
    };
  }
}
