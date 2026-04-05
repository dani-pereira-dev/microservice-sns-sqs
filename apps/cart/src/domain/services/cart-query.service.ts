import { Injectable } from '@nestjs/common';
import { CartProductProjectionsRepository } from '../../persistence/cart-product-projections.repository';
import { CartRepository } from '../../persistence/cart.repository';
import {
  ensureExistingCart,
  ensureExistingProductProjection,
} from '../validators/cart.domain.validators';

@Injectable()
export class CartQueryService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly cartProductProjectionsRepository: CartProductProjectionsRepository,
  ) {}

  listCarts() {
    return this.cartRepository.list();
  }

  listProductProjections() {
    return this.cartProductProjectionsRepository.list();
  }

  getProductProjectionById(productId: string) {
    return ensureExistingProductProjection(
      this.cartProductProjectionsRepository.findById(productId),
      productId,
    );
  }

  getCartById(cartId: string) {
    return ensureExistingCart(this.cartRepository.findById(cartId), cartId);
  }
}
