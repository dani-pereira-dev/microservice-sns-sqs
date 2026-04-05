import { Injectable } from '@nestjs/common';
import { OrdersRepository } from '../../persistence/orders.repository';
import { requireExistingOrder } from '../validators/orders.domain.validators';

@Injectable()
export class OrdersQueryService {
  constructor(private readonly ordersRepository: OrdersRepository) {}

  listOrders() {
    return this.ordersRepository.list();
  }

  getOrderById(orderId: string) {
    return requireExistingOrder(this.ordersRepository.findById(orderId), orderId);
  }
}
