import { PaymentConfirmation } from './types';

export const createPlainTextBody = (payment: PaymentConfirmation): string =>
  [
    'Se recibio una confirmacion de pago.',
    '',
    `paymentId: ${payment.paymentId}`,
    `orderId: ${payment.orderId}`,
    `amount: ${payment.amount}`,
    `paymentMethod: ${payment.paymentMethod}`,
    `status: ${payment.status}`,
    `confirmedAt: ${payment.confirmedAt}`,
    `idempotencyKey: ${payment.idempotencyKey}`,
  ].join('\n');

export const createHtmlBody = (payment: PaymentConfirmation): string => `
  <h1>Pago confirmado</h1>
  <p>Se recibio una confirmacion de pago para la orden <strong>${escapeHtml(
    payment.orderId,
  )}</strong>.</p>
  <ul>
    <li><strong>paymentId:</strong> ${escapeHtml(payment.paymentId)}</li>
    <li><strong>orderId:</strong> ${escapeHtml(payment.orderId)}</li>
    <li><strong>amount:</strong> ${escapeHtml(String(payment.amount))}</li>
    <li><strong>paymentMethod:</strong> ${escapeHtml(payment.paymentMethod)}</li>
    <li><strong>status:</strong> ${escapeHtml(payment.status)}</li>
    <li><strong>confirmedAt:</strong> ${escapeHtml(payment.confirmedAt)}</li>
    <li><strong>idempotencyKey:</strong> ${escapeHtml(payment.idempotencyKey)}</li>
  </ul>
`;

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
