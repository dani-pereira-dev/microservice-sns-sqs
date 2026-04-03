import { Body, Controller, Get, Post } from "@nestjs/common";
import { CreateOrderRequest } from "@shared/contracts/orders";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  listOrders() {
    return this.ordersService.listOrders();
  }

  @Post()
  createOrder(@Body() body: CreateOrderRequest) {
    return this.ordersService.createOrder(body);
  }
}
