import { OrderStatus } from '@unchainedshop/core-orders';
import type { Modules } from '../modules.ts';
import { nextUserCartService } from './nextUserCart.ts';
import { validateOrderService } from './validateOrder.ts';
import { processOrderService } from './processOrder.ts';
import type { User } from '@unchainedshop/core-users';

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
  if (!order) return null;
  if (order.status !== null) return order;

  await validateOrderService.bind(this)(order);

  const lock = await this.orders.acquireLock(order._id, 'checkout');

  try {
    const processedOrder = await processOrderService.bind(this)(order, transactionContext);

    // After checkout, store last checkout information on user
    if (processedOrder.billingAddress) {
      await this.users.updateLastBillingAddress(processedOrder.userId, processedOrder.billingAddress);
    }
    if (processedOrder.contact) {
      await this.users.updateLastContact(processedOrder.userId, processedOrder.contact);
    }
    // Then eventually build next cart
    const user = (await this.users.findUserById(processedOrder.userId)) as User;
    const locale = this.users.userLocale(user);
    await nextUserCartService.bind(this)({
      user,
      countryCode: locale?.region || processedOrder.countryCode,
    });

    return processedOrder;
  } finally {
    await lock.release();
  }
}
