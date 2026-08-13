import { type Order, ordersSettings } from '@unchainedshop/core-orders';
import type { Modules } from '../modules.ts';
import { createServiceError } from '../errors.ts';

export async function validateOrderService(this: Modules, order: Order) {
  if (!order.contact) throw createServiceError('ContactMissingError', 'Contact data not provided');
  if (!order.billingAddress)
    throw createServiceError('BillingAddressMissingError', 'Billing address not provided');
  if (
    !order.deliveryId ||
    !(await this.orders.deliveries.findDelivery({ orderDeliveryId: order.deliveryId }))
  )
    throw createServiceError('NoDeliveryProviderError', 'No delivery provider selected');
  if (
    !order.paymentId ||
    !(await this.orders.payments.findOrderPayment({ orderPaymentId: order.paymentId }))
  )
    throw createServiceError('NoPaymentProviderError', 'No payment provider selected');

  const orderPositions = await this.orders.positions.findOrderPositions({ orderId: order._id });
  if (orderPositions.length === 0) {
    throw createServiceError('NoItemsError', 'No items to checkout');
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
      throw createServiceError(
        'QuotationInvalidError',
        'Quotation expired or fulfilled, please request a new offer',
      );
    }
  }
}
