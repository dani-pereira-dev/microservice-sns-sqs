import { Injectable } from '@nestjs/common';
import { CartRepository } from '../../persistence/cart.repository';
import { ensureExistingCart } from '../validators/cart.domain.validators';

@Injectable()
export class CartQueryService {
  constructor(private readonly cartRepository: CartRepository) {}

  listCarts() {
    return this.cartRepository.list();
  }

  getCartById(cartId: string) {
    return ensureExistingCart(this.cartRepository.findById(cartId), cartId);
  }
}
