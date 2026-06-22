import type { Modules } from '../modules.ts';

// Deletes a cart and all of its sub-documents. Order delete does not cascade, so
// positions/payments/deliveries/discounts must be removed explicitly.
export async function deleteCartService(this: Modules, orderId: string) {
  await this.orders.positions.deleteOrderPositions(orderId);
  await this.orders.payments.deleteOrderPayments(orderId);
  await this.orders.deliveries.deleteOrderDeliveries(orderId);
  await this.orders.discounts.deleteOrderDiscounts(orderId);
  return this.orders.delete(orderId);
}
