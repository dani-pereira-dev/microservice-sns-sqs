import { Injectable } from '@nestjs/common';
import {
  AddCartItemRequest,
  CreateCartRequest,
  UpdateCartItemRequest,
} from '@shared/contracts/cart';
import { CartCommandService } from './cart-command.service';
import { CartQueryService } from './cart-query.service';

@Injectable()
export class CartService {
  constructor(
    private readonly cartQueryService: CartQueryService,
    private readonly cartCommandService: CartCommandService,
  ) {}

  listCarts() {
    return this.cartQueryService.listCarts();
  }

  getCartById(cartId: string) {
    return this.cartQueryService.getCartById(cartId);
  }

  createCart(input: CreateCartRequest) {
    return this.cartCommandService.createCart(input);
  }

  async addItem(cartId: string, input: AddCartItemRequest) {
    return this.cartCommandService.addItem(cartId, input);
  }

  updateItem(cartId: string, itemId: string, input: UpdateCartItemRequest) {
    return this.cartCommandService.updateItem(cartId, itemId, input);
  }

  removeItem(cartId: string, itemId: string) {
    return this.cartCommandService.removeItem(cartId, itemId);
  }

  async checkout(cartId: string) {
    return this.cartCommandService.checkout(cartId);
  }
}
