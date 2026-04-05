import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  AddCartItemRequest,
  CreateCartRequest,
  UpdateCartItemRequest,
} from '@shared/contracts/cart';
import { CartService } from '../domain/services/cart.service';

@Controller('carts')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  listCarts() {
    return this.cartService.listCarts();
  }

  @Get('product-projections')
  listProductProjections() {
    return this.cartService.listProductProjections();
  }

  @Get('product-projections/:productId')
  getProductProjectionById(@Param('productId') productId: string) {
    return this.cartService.getProductProjectionById(productId);
  }

  @Get(':cartId')
  getCartById(@Param('cartId') cartId: string) {
    return this.cartService.getCartById(cartId);
  }

  @Post()
  createCart(@Body() body: CreateCartRequest) {
    return this.cartService.createCart(body);
  }

  @Post(':cartId/items')
  addItem(
    @Param('cartId') cartId: string,
    @Body() body: AddCartItemRequest,
  ) {
    return this.cartService.addItem(cartId, body);
  }

  @Patch(':cartId/items/:itemId')
  updateItem(
    @Param('cartId') cartId: string,
    @Param('itemId') itemId: string,
    @Body() body: UpdateCartItemRequest,
  ) {
    return this.cartService.updateItem(cartId, itemId, body);
  }

  @Delete(':cartId/items/:itemId')
  removeItem(
    @Param('cartId') cartId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.cartService.removeItem(cartId, itemId);
  }

  @Post(':cartId/checkout')
  checkout(@Param('cartId') cartId: string) {
    return this.cartService.checkout(cartId);
  }
}
