import {
  ORDER_CONFIRMATION_FAILED_EVENT,
  ORDER_CONFIRMED_EVENT,
  OrderStatusEvent,
} from '@shared/contracts/events';

export interface NotificationEmailContent {
  subject: string;
  text: string;
}

export const buildNotificationEmailContent = (
  event: OrderStatusEvent,
): NotificationEmailContent => {
  if (event.eventType === ORDER_CONFIRMED_EVENT) {
    return {
      subject: `Orden confirmada: ${event.payload.orderId}`,
      text: [
        'La orden fue confirmada correctamente.',
        '',
        `orderId: ${event.payload.orderId}`,
        `customerName: ${event.payload.customerName}`,
        `amount: ${event.payload.amount}`,
        `paymentId: ${event.payload.payment.paymentId}`,
        `paymentMethod: ${event.payload.payment.paymentMethod}`,
        `confirmedAt: ${event.payload.confirmedAt}`,
        `idempotencyKey: ${event.payload.payment.idempotencyKey}`,
        'resultado: exito',
      ].join('\n'),
    };
  }

  if (event.eventType === ORDER_CONFIRMATION_FAILED_EVENT) {
    return {
      subject: `Fallo en confirmacion de orden: ${event.payload.orderId}`,
      text: [
        'La orden no pudo confirmarse.',
        '',
        `orderId: ${event.payload.orderId}`,
        `paymentId: ${event.payload.payment.paymentId}`,
        `amount: ${event.payload.payment.amount}`,
        `paymentMethod: ${event.payload.payment.paymentMethod}`,
        `failedAt: ${event.payload.failedAt}`,
        `idempotencyKey: ${event.payload.payment.idempotencyKey}`,
        `motivo: ${event.payload.reason}`,
        'resultado: fallo',
      ].join('\n'),
    };
  }

  throw new Error('Unsupported order status event.');
};
