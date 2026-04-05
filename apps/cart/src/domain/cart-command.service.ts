import { Injectable } from '@nestjs/common';
import {
  AddCartItemRequest,
  Cart,
  CartItem,
  CreateCartRequest,
  UpdateCartItemRequest,
} from '@shared/contracts/cart';
import { CheckoutInitiatedPayload } from '@shared/contracts/events';
import { CartCheckoutPublisher } from '../messaging/cart-checkout.publisher';
import { CartProductProjectionsRepository } from '../persistence/cart-product-projections.repository';
import { CartRepository } from '../persistence/cart.repository';
import { CartQueryService } from './cart-query.service';
import {
  ensureCartHasItemsForCheckout,
  ensureCartIsOpen,
  ensureExistingCartItem,
  ensureExistingProductProjection,
  ensureProductProjectionIsActive,
  validateCartItemQuantity,
  validateCreateCartInput,
} from './cart.domain.validators';

@Injectable()
export class CartCommandService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly cartQueryService: CartQueryService,
    private readonly cartProductProjectionsRepository: CartProductProjectionsRepository,
    private readonly cartCheckoutPublisher: CartCheckoutPublisher,
  ) {}

  createCart(input: CreateCartRequest) {
    validateCreateCartInput(input.customerName);

    const now = new Date().toISOString();
    const cart: Cart = {
      id: crypto.randomUUID(),
      customerName: input.customerName.trim(),
      status: 'open',
      items: [],
      totalAmount: 0,
      createdAt: now,
      updatedAt: now,
    };

    return this.cartRepository.createCart(cart);
  }

  async addItem(cartId: string, input: AddCartItemRequest) {
    validateCartItemQuantity(input.quantity);

    const cart = this.requireOpenCart(cartId);
    const product = this.requireActiveProductProjection(input.productId);
    const existingItem = this.cartRepository.findItemByProductId(
      cart.id,
      product.id,
    );

    const quantity = (existingItem?.quantity ?? 0) + input.quantity;
    const cartItem: CartItem = {
      id: existingItem?.id ?? crypto.randomUUID(),
      productId: product.id,
      productTitleSnapshot: product.title,
      unitPrice: product.price,
      quantity,
      lineTotal: product.price * quantity,
    };

    this.cartRepository.upsertCartItem(cart.id, cartItem);
    cart.updatedAt = new Date().toISOString();
    this.cartRepository.saveCart(cart);

    return this.cartQueryService.getCartById(cart.id);
  }

  updateItem(cartId: string, itemId: string, input: UpdateCartItemRequest) {
    validateCartItemQuantity(input.quantity);

    const cart = this.requireOpenCart(cartId);
    const existingItem = ensureExistingCartItem(
      this.cartRepository.findItemById(cart.id, itemId),
      itemId,
    );

    const updatedItem: CartItem = {
      ...existingItem,
      quantity: input.quantity,
      lineTotal: existingItem.unitPrice * input.quantity,
    };

    this.cartRepository.upsertCartItem(cart.id, updatedItem);
    cart.updatedAt = new Date().toISOString();
    this.cartRepository.saveCart(cart);

    return this.cartQueryService.getCartById(cart.id);
  }

  removeItem(cartId: string, itemId: string) {
    const cart = this.requireOpenCart(cartId);
    ensureExistingCartItem(this.cartRepository.findItemById(cart.id, itemId), itemId);

    this.cartRepository.deleteCartItem(cart.id, itemId);
    cart.updatedAt = new Date().toISOString();
    this.cartRepository.saveCart(cart);

    return this.cartQueryService.getCartById(cart.id);
  }

  async checkout(cartId: string) {
    const cart = this.requireOpenCart(cartId);
    ensureCartHasItemsForCheckout(cart);

    const now = new Date().toISOString();
    const checkoutPayload: CheckoutInitiatedPayload = {
      checkoutId: crypto.randomUUID(),
      cartId: cart.id,
      customerName: cart.customerName,
      items: cart.items.map((item) => ({
        productId: item.productId,
        productTitleSnapshot: item.productTitleSnapshot,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      })),
      requestedAt: now,
    };

    const previousUpdatedAt = cart.updatedAt;
    cart.status = 'checked_out';
    cart.updatedAt = now;
    this.cartRepository.saveCart(cart);

    try {
      await this.cartCheckoutPublisher.publishCheckoutInitiated(checkoutPayload);
    } catch (error) {
      cart.status = 'open';
      cart.updatedAt = previousUpdatedAt;
      this.cartRepository.saveCart(cart);
      throw error;
    }

    return {
      cartId: cart.id,
      status: 'accepted',
      checkout: {
        checkoutId: checkoutPayload.checkoutId,
        status: 'pending_async_order_creation',
      },
      totalAmount: cart.totalAmount,
    };
  }

  private requireOpenCart(cartId: string) {
    return ensureCartIsOpen(this.cartQueryService.getCartById(cartId));
  }

  private requireActiveProductProjection(productId: string) {
    const productProjection = ensureExistingProductProjection(
      this.cartProductProjectionsRepository.findById(productId),
      productId,
    );

    return ensureProductProjectionIsActive(productProjection, productId);
  }
}
