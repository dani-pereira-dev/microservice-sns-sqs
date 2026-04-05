import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateProductRequest,
  Product,
  UpdateProductRequest,
} from '@shared/contracts/products';
import { ProductsRepository } from '../persistence/products.repository';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  listProducts() {
    return this.productsRepository.list();
  }

  getProductById(productId: string) {
    const product = this.productsRepository.findById(productId);

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found.`);
    }

    return product;
  }

  createProduct(input: CreateProductRequest) {
    this.validateCreateProductInput(input);

    const now = new Date().toISOString();
    const product: Product = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      price: input.price,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    return this.productsRepository.create(product);
  }

  updateProduct(productId: string, input: UpdateProductRequest) {
    this.validateUpdateProductInput(input);

    const existingProduct = this.productsRepository.findById(productId);

    if (!existingProduct) {
      throw new NotFoundException(`Product ${productId} not found.`);
    }

    const updatedProduct: Product = {
      ...existingProduct,
      title: input.title?.trim() || existingProduct.title,
      price: input.price ?? existingProduct.price,
      active: input.active ?? existingProduct.active,
      updatedAt: new Date().toISOString(),
    };

    return this.productsRepository.save(updatedProduct);
  }

  private validateCreateProductInput(input: CreateProductRequest) {
    if (!input.title?.trim()) {
      throw new BadRequestException('title is required.');
    }

    if (typeof input.price !== 'number' || input.price <= 0) {
      throw new BadRequestException('price must be a number greater than 0.');
    }
  }

  private validateUpdateProductInput(input: UpdateProductRequest) {
    if (input.title !== undefined && !input.title.trim()) {
      throw new BadRequestException('title cannot be empty.');
    }

    if (
      input.price !== undefined &&
      (typeof input.price !== 'number' || input.price <= 0)
    ) {
      throw new BadRequestException('price must be a number greater than 0.');
    }
  }
}
