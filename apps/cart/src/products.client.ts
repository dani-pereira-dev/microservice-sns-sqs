import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceConfig } from '@shared/config/service-config.types';
import { Product } from '@shared/contracts/products';

@Injectable()
export class ProductsClient {
  constructor(
    private readonly configService: ConfigService<ServiceConfig, true>,
  ) {}

  async getProductById(productId: string): Promise<Product> {
    const productsBaseUrl = this.configService.get(
      'dependencies.productsBaseUrl',
      {
        infer: true,
      },
    );

    const response = await fetch(
      `${productsBaseUrl}/products/${encodeURIComponent(productId)}`,
    );

    if (response.status === 404) {
      throw new NotFoundException(`Product ${productId} not found.`);
    }

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Products service responded with status ${response.status}.`,
      );
    }

    const product = (await response.json()) as Product;

    if (!product.active) {
      throw new BadRequestException(`Product ${productId} is not active.`);
    }

    return product;
  }
}
