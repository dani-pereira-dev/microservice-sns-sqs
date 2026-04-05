import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AddCartItemRequest,
  Cart,
  CartItem,
  CreateCartRequest,
  UpdateCartItemRequest,
} from '@shared/contracts/cart';
import { CartRepository } from './cart.repository';
import { OrdersClient } from './orders.client';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly ordersClient: OrdersClient,
  ) {}

  listCarts() {
    return this.cartRepository.list();
  }

  listProductProjections() {
    return this.cartRepository.listProductProjections();
  }

  getProductProjectionById(productId: string) {
    const productProjection =
      this.cartRepository.findProductProjectionById(productId);

    if (!productProjection) {
      throw new NotFoundException(
        `Product projection ${productId} not found in cart.`,
      );
    }

    return productProjection;
  }

  getCartById(cartId: string) {
    const cart = this.cartRepository.findById(cartId);

    if (!cart) {
      throw new NotFoundException(`Cart ${cartId} not found.`);
    }

    return cart;
  }

  createCart(input: CreateCartRequest) {
    if (!input.customerName?.trim()) {
      throw new BadRequestException('customerName is required.');
    }

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
    this.validateQuantity(input.quantity);

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

    return this.getCartById(cart.id);
  }

  updateItem(cartId: string, itemId: string, input: UpdateCartItemRequest) {
    this.validateQuantity(input.quantity);

    const cart = this.requireOpenCart(cartId);
    const existingItem = this.cartRepository.findItemById(cart.id, itemId);

    if (!existingItem) {
      throw new NotFoundException(`Cart item ${itemId} not found.`);
    }

    const updatedItem: CartItem = {
      ...existingItem,
      quantity: input.quantity,
      lineTotal: existingItem.unitPrice * input.quantity,
    };

    this.cartRepository.upsertCartItem(cart.id, updatedItem);
    cart.updatedAt = new Date().toISOString();
    this.cartRepository.saveCart(cart);

    return this.getCartById(cart.id);
  }

  removeItem(cartId: string, itemId: string) {
    const cart = this.requireOpenCart(cartId);
    const existingItem = this.cartRepository.findItemById(cart.id, itemId);

    if (!existingItem) {
      throw new NotFoundException(`Cart item ${itemId} not found.`);
    }

    this.cartRepository.deleteCartItem(cart.id, itemId);
    cart.updatedAt = new Date().toISOString();
    this.cartRepository.saveCart(cart);

    return this.getCartById(cart.id);
  }

  async checkout(cartId: string) {
    const cart = this.requireOpenCart(cartId);

    if (cart.items.length === 0) {
      throw new BadRequestException('Cart must contain at least one item.');
    }

    const order = await this.ordersClient.createOrder({
      customerName: cart.customerName,
      items: cart.items.map((item) => ({
        productId: item.productId,
        productTitleSnapshot: item.productTitleSnapshot,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      })),
      sourceCartId: cart.id,
    });

    cart.status = 'checked_out';
    cart.updatedAt = new Date().toISOString();
    cart.checkedOutOrderId = order.id;
    this.cartRepository.saveCart(cart);

    return {
      cartId: cart.id,
      orderId: order.id,
      status: cart.status,
      totalAmount: order.amount,
    };
  }

  private requireOpenCart(cartId: string) {
    const cart = this.getCartById(cartId);

    if (cart.status !== 'open') {
      throw new BadRequestException(`Cart ${cart.id} is not open.`);
    }

    return cart;
  }

  private requireActiveProductProjection(productId: string) {
    const productProjection =
      this.cartRepository.findProductProjectionById(productId);

    if (!productProjection) {
      throw new NotFoundException(
        `Product projection ${productId} not found in cart.`,
      );
    }

    if (!productProjection.active) {
      throw new BadRequestException(
        `Product projection ${productId} is not active in cart.`,
      );
    }

    return productProjection;
  }

  private validateQuantity(quantity: number) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestException(
        'quantity must be an integer greater than 0.',
      );
    }
  }
}
