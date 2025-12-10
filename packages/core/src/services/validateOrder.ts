import { type Order, ordersSettings } from '@unchainedshop/core-orders';
import type { Modules } from '../modules.ts';

export async function validateOrderService(this: Modules, order: Order) {
  if (!order.contact) throw new Error('Contact data not provided');
  if (!order.billingAddress) throw new Error('Billing address not provided');
  if (
    !order.deliveryId ||
    !(await this.orders.deliveries.findDelivery({ orderDeliveryId: order.deliveryId }))
  )
    throw new Error('No delivery provider selected');
  if (
    !order.paymentId ||
    !(await this.orders.payments.findOrderPayment({ orderPaymentId: order.paymentId }))
  )
    throw new Error('No payment provider selected');

  const orderPositions = await this.orders.positions.findOrderPositions({ orderId: order._id });
  if (orderPositions.length === 0) {
    const NoItemsError = new Error('No items to checkout');
    NoItemsError.name = 'NoItemsError';
    throw NoItemsError;
  }

  for (const orderPosition of orderPositions) {
    const product = await this.products.findProduct({
      productId: orderPosition.productId,
    });

    await ordersSettings.validateOrderPosition(
      {
        order,
        product,
        configuration: orderPosition.configuration,
        quantityDiff: 0,
      },
      { modules: this },
    );

    const quotation =
      orderPosition.quotationId &&
      (await this.quotations.findQuotation({
        quotationId: orderPosition.quotationId,
      }));
    if (quotation && !this.quotations.isProposalValid(quotation)) {
      throw new Error('Quotation expired or fullfiled, please request a new offer');
    }
  }
}
