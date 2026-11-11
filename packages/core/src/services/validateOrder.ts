import { type Order, ordersSettings } from '@unchainedshop/core-orders';
import type { Modules } from '../modules.ts';
import { createServiceError } from '../errors.ts';

/** Holds a lock on each product with a limited supply until the result is disposed */
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

  const products = await Promise.all(
    orderPositions.map(({ productId }) => this.products.findProduct({ productId })),
  );
  const limitedSupplyProductIds = [
    ...new Set(products.flatMap((product) => (product?.tokenization?.supply ? [product._id] : []))),
  ].sort();
  const locks: { release: () => Promise<void> }[] = [];
  const release = async () => {
    await Promise.all(locks.splice(0).map((lock) => lock.release()));
  };

  try {
    for (const productId of limitedSupplyProductIds) {
      locks.push(await this.orders.acquireLock(productId, 'supply'));
    }

    for (const [index, orderPosition] of orderPositions.entries()) {
      await ordersSettings.validateOrderPosition(
        {
          order,
          product: products[index],
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
      // The pricing falls back to the catalog price for a quotation that does not apply to the
      // position, so checking out would charge the catalog price and fulfil the quotation
      if (
        quotation &&
        !this.quotations.isProposalValidFor(quotation, {
          userId: order.userId,
          productId: orderPosition.productId,
          currencyCode: order.currencyCode,
        })
      ) {
        throw createServiceError(
          'QuotationInvalidError',
          'Quotation expired, fulfilled or not valid for this order, please request a new offer',
        );
      }
    }
  } catch (error) {
    await release();
    throw error;
  }
  return { [Symbol.asyncDispose]: release };
}
