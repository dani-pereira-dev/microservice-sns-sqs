import {
  ORDER_CONFIRMATION_FAILED_EVENT,
  ORDER_CONFIRMED_EVENT,
  OrderStatusEvent,
} from './types';

export const createSubject = (event: OrderStatusEvent): string =>
  event.eventType === ORDER_CONFIRMED_EVENT
    ? `Orden confirmada: ${event.payload.orderId}`
    : `Fallo en confirmacion de orden: ${event.payload.orderId}`;

export const createPlainTextBody = (event: OrderStatusEvent): string => {
  if (event.eventType === ORDER_CONFIRMED_EVENT) {
    return [
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
    ].join('\n');
  }

  if (event.eventType === ORDER_CONFIRMATION_FAILED_EVENT) {
    return [
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
    ].join('\n');
  }

  return 'Evento no soportado.';
};

export const createHtmlBody = (event: OrderStatusEvent): string => {
  if (event.eventType === ORDER_CONFIRMED_EVENT) {
    return `
      <h1>Orden confirmada</h1>
      <p>La orden <strong>${escapeHtml(
        event.payload.orderId,
      )}</strong> fue confirmada correctamente.</p>
      <ul>
        <li><strong>customerName:</strong> ${escapeHtml(
          event.payload.customerName,
        )}</li>
        <li><strong>amount:</strong> ${escapeHtml(
          String(event.payload.amount),
        )}</li>
        <li><strong>paymentId:</strong> ${escapeHtml(
          event.payload.payment.paymentId,
        )}</li>
        <li><strong>paymentMethod:</strong> ${escapeHtml(
          event.payload.payment.paymentMethod,
        )}</li>
        <li><strong>confirmedAt:</strong> ${escapeHtml(
          event.payload.confirmedAt,
        )}</li>
        <li><strong>idempotencyKey:</strong> ${escapeHtml(
          event.payload.payment.idempotencyKey,
        )}</li>
        <li><strong>resultado:</strong> exito</li>
      </ul>
    `;
  }

  return `
    <h1>Fallo en confirmacion de orden</h1>
    <p>La orden <strong>${escapeHtml(
      event.payload.orderId,
    )}</strong> no pudo confirmarse.</p>
    <ul>
      <li><strong>paymentId:</strong> ${escapeHtml(
        event.payload.payment.paymentId,
      )}</li>
      <li><strong>amount:</strong> ${escapeHtml(
        String(event.payload.payment.amount),
      )}</li>
      <li><strong>paymentMethod:</strong> ${escapeHtml(
        event.payload.payment.paymentMethod,
      )}</li>
      <li><strong>failedAt:</strong> ${escapeHtml(event.payload.failedAt)}</li>
      <li><strong>idempotencyKey:</strong> ${escapeHtml(
        event.payload.payment.idempotencyKey,
      )}</li>
      <li><strong>motivo:</strong> ${escapeHtml(event.payload.reason)}</li>
      <li><strong>resultado:</strong> fallo</li>
    </ul>
  `;
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
