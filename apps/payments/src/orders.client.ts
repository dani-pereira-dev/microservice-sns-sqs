import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceConfig } from '@shared/config/service-config.types';
import { Order } from '@shared/contracts/orders';

@Injectable()
export class OrdersClient {
  constructor(
    private readonly configService: ConfigService<ServiceConfig, true>,
  ) {}

  async getOrderById(orderId: string): Promise<Order> {
    const ordersBaseUrl = this.configService.get('dependencies.ordersBaseUrl', {
      infer: true,
    });

    const response = await fetch(
      `${ordersBaseUrl}/orders/${encodeURIComponent(orderId)}`,
    );

    if (response.status === 404) {
      throw new NotFoundException(`Order ${orderId} not found.`);
    }

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Orders service responded with status ${response.status}.`,
      );
    }

    return (await response.json()) as Order;
  }

  async validateOrderForPayment(orderId: string) {
    const order = await this.getOrderById(orderId);

    if (order.status !== 'pending') {
      throw new BadRequestException(
        `Order ${orderId} must be pending to accept a new payment.`,
      );
    }

    return order;
  }
}
