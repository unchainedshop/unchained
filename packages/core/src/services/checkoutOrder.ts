import { OrderStatus } from '@unchainedshop/core-orders';
import { Modules } from '../modules.js';
import { nextUserCartService } from './nextUserCart.js';
import { validateOrderService } from './validateOrder.js';
import { processOrderService } from './processOrder.js';

export const checkoutOrderService = async (
  orderId: string,
  transactionContext: {
    paymentContext?: any;
    deliveryContext?: any;
    comment?: string;
    nextStatus?: OrderStatus;
  },
  unchainedAPI: { modules: Modules },
) => {
  const { modules } = unchainedAPI;

  const order = await modules.orders.findOrder({ orderId });
  if (order.status !== null) return order;

  await validateOrderService(order, unchainedAPI);

  const lock = await modules.orders.acquireLock(order._id, 'checkout');

  try {
    const processedOrder = await processOrderService(order, transactionContext, unchainedAPI);

    // After checkout, store last checkout information on user
    await modules.users.updateLastBillingAddress(processedOrder.userId, processedOrder.billingAddress);
    await modules.users.updateLastContact(processedOrder.userId, processedOrder.contact);

    // Then eventually build next cart
    const user = await modules.users.findUserById(processedOrder.userId);
    const locale = modules.users.userLocale(user);
    await nextUserCartService(
      {
        user,
        countryCode: locale.region,
      },
      unchainedAPI,
    );

    return processedOrder;
  } finally {
    await lock.release();
  }
};
