import { Order, ordersSettings } from '@unchainedshop/core-orders';
import { Modules } from '../modules.js';

export const validateOrderService = async (order: Order, unchainedAPI: { modules: Modules }) => {
  const { modules } = unchainedAPI;

  const errors = [];
  if (!order.contact) errors.push(new Error('Contact data not provided'));
  if (!order.billingAddress) errors.push(new Error('Billing address not provided'));
  if (!(await modules.orders.deliveries.findDelivery({ orderDeliveryId: order.deliveryId })))
    errors.push('No delivery provider selected');
  if (!(await modules.orders.payments.findOrderPayment({ orderPaymentId: order.paymentId })))
    errors.push('No payment provider selected');

  const orderPositions = await modules.orders.positions.findOrderPositions({ orderId: order._id });
  if (orderPositions.length === 0) {
    const NoItemsError = new Error('No items to checkout');
    NoItemsError.name = 'NoItemsError';
    return [NoItemsError];
  }
  await Promise.all(
    orderPositions.map(async (orderPosition) => {
      const product = await unchainedAPI.modules.products.findProduct({
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
          unchainedAPI,
        );
      } catch (e) {
        errors.push(e);
      }

      const quotation =
        orderPosition.quotationId &&
        (await unchainedAPI.modules.quotations.findQuotation({
          quotationId: orderPosition.quotationId,
        }));
      if (quotation && !unchainedAPI.modules.quotations.isProposalValid(quotation)) {
        errors.push(new Error('Quotation expired or fullfiled, please request a new offer'));
      }
    }),
  );

  if (errors.length > 0) {
    throw new Error(errors[0]);
  }
};
