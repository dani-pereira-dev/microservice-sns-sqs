import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CreateOrderRequest } from "@shared/contracts/orders";
import { OrdersService } from "../domain/services/orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  listOrders() {
    return this.ordersService.listOrders();
  }

  @Get(":orderId")
  getOrderById(@Param("orderId") orderId: string) {
    return this.ordersService.getOrderById(orderId);
  }

  @Post()
  createOrder(@Body() body: CreateOrderRequest) {
    return this.ordersService.createOrder(body);
  }
}
