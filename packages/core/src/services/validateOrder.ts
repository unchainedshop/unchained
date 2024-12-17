import { Order, ordersSettings } from '@unchainedshop/core-orders';
import { Modules } from '../modules.js';

export async function validateOrderService(this: Modules, order: Order) {
  const errors = [];
  if (!order.contact) errors.push(new Error('Contact data not provided'));
  if (!order.billingAddress) errors.push(new Error('Billing address not provided'));
  if (!(await this.orders.deliveries.findDelivery({ orderDeliveryId: order.deliveryId })))
    errors.push('No delivery provider selected');
  if (!(await this.orders.payments.findOrderPayment({ orderPaymentId: order.paymentId })))
    errors.push('No payment provider selected');

  const orderPositions = await this.orders.positions.findOrderPositions({ orderId: order._id });
  if (orderPositions.length === 0) {
    const NoItemsError = new Error('No items to checkout');
    NoItemsError.name = 'NoItemsError';
    return [NoItemsError];
  }
  await Promise.all(
    orderPositions.map(async (orderPosition) => {
      const product = await this.products.findProduct({
        productId: orderPosition.productId,
      });

      try {
        await ordersSettings.validateOrderPosition(
          {
            order,
            product,
            configuration: orderPosition.configuration,
            quantityDiff: 0,
          },
          { modules: this },
        );
      } catch (e) {
        errors.push(e);
      }

      const quotation =
        orderPosition.quotationId &&
        (await this.quotations.findQuotation({
          quotationId: orderPosition.quotationId,
        }));
      if (quotation && !this.quotations.isProposalValid(quotation)) {
        errors.push(new Error('Quotation expired or fullfiled, please request a new offer'));
      }
    }),
  );

  if (errors.length > 0) {
    throw new Error(errors[0]);
  }
}
