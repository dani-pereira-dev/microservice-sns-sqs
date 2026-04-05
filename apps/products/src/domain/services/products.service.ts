import { Injectable } from '@nestjs/common';
import {
  CreateProductRequest,
  UpdateProductRequest,
} from '@shared/contracts/products';
import { ProductsCommandService } from './products-command.service';
import { ProductsQueryService } from './products-query.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsQueryService: ProductsQueryService,
    private readonly productsCommandService: ProductsCommandService,
  ) {}

  listProducts() {
    return this.productsQueryService.listProducts();
  }

  getProductById(productId: string) {
    return this.productsQueryService.getProductById(productId);
  }

  createProduct(input: CreateProductRequest) {
    return this.productsCommandService.createProduct(input);
  }

  updateProduct(productId: string, input: UpdateProductRequest) {
    return this.productsCommandService.updateProduct(productId, input);
  }
}
