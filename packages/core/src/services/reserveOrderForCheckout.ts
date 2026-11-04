import { type Order, ordersSettings } from '@unchainedshop/core-orders';
import { createLogger } from '@unchainedshop/logger';
import type { Modules } from '../modules.ts';

const logger = createLogger('unchained:core:checkoutOrder');

/**
 * Runs the ordersSettings.reserveForCheckout() hook before payment starts. The returned release
 * never throws, like the discount reservations': a failed release must not turn a completed
 * checkout into an error.
 */
export async function reserveOrderForCheckout(this: Modules, order: Order) {
  const reservation = await ordersSettings.reserveForCheckout?.(order, { modules: this });
  const release = async () => {
    try {
      await reservation?.release();
    } catch (error) {
      logger.error(`Could not release the checkout reservation of order ${order._id}`, { error });
    }
  };
  return { release };
}
