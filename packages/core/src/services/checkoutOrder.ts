import { OrderStatus } from '@unchainedshop/core-orders';
import { Modules } from '../modules.js';
import { nextUserCartService } from './nextUserCart.js';
import { validateOrderService } from './validateOrder.js';
import { processOrderService } from './processOrder.js';

export async function checkoutOrderService(
  this: Modules,
  orderId: string,
  transactionContext: {
    paymentContext?: any;
    deliveryContext?: any;
    comment?: string;
    nextStatus?: OrderStatus;
  },
) {
  const order = await this.orders.findOrder({ orderId });
  if (order.status !== null) return order;

  await validateOrderService.bind(this)(order);

  const lock = await this.orders.acquireLock(order._id, 'checkout');

  try {
    const processedOrder = await processOrderService.bind(this)(order, transactionContext);

    // After checkout, store last checkout information on user
    await this.users.updateLastBillingAddress(processedOrder.userId, processedOrder.billingAddress);
    await this.users.updateLastContact(processedOrder.userId, processedOrder.contact);

    // Then eventually build next cart
    const user = await this.users.findUserById(processedOrder.userId);
    const locale = this.users.userLocale(user);
    await nextUserCartService.bind(this)({
      user,
      countryCode: locale.region,
    });

    return processedOrder;
  } finally {
    await lock.release();
  }
}
