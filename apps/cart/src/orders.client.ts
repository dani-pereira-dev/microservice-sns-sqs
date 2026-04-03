import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceConfig } from '@shared/config/service-config.types';
import { CreateOrderRequest, Order } from '@shared/contracts/orders';

@Injectable()
export class OrdersClient {
  constructor(
    private readonly configService: ConfigService<ServiceConfig, true>,
  ) {}

  async createOrder(input: CreateOrderRequest): Promise<Order> {
    const ordersBaseUrl = this.configService.get('dependencies.ordersBaseUrl', {
      infer: true,
    });

    const response = await fetch(`${ordersBaseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Orders service responded with status ${response.status}.`,
      );
    }

    return (await response.json()) as Order;
  }
}
