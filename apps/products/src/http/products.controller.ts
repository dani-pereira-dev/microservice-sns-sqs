import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  CreateProductRequest,
  UpdateProductRequest,
} from '@shared/contracts/products';
import { ProductsService } from '../domain/services/products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  listProducts() {
    return this.productsService.listProducts();
  }

  @Get(':productId')
  getProductById(@Param('productId') productId: string) {
    return this.productsService.getProductById(productId);
  }

  @Post()
  createProduct(@Body() body: CreateProductRequest) {
    return this.productsService.createProduct(body);
  }

  @Patch(':productId')
  updateProduct(
    @Param('productId') productId: string,
    @Body() body: UpdateProductRequest,
  ) {
    return this.productsService.updateProduct(productId, body);
  }
}
