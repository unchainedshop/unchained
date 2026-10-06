import { type Order, OrderStatus } from '@unchainedshop/core-orders';
import type { Modules } from '../modules.ts';
import { createServiceError } from '../errors.ts';

// Spans the payment attempt: another checkout only sees the order as holding the quotation once
// processOrder persisted its status
const RESERVATION_LOCK_TTL = 60000;

/**
 * A quotation is reserved while a checked-out order that is not rejected holds a position of it:
 * a pending order reserves it, confirming the order fulfils it, rejecting the order releases it.
 */
export async function isQuotationReserved(
  this: Modules,
  quotationId: string,
  { exceptOrderId }: { exceptOrderId?: string } = {},
) {
  const orderIds = (await this.orders.positions.findOrderPositions({ quotationId }))
    .map(({ orderId }) => orderId)
    .filter((orderId) => orderId !== exceptOrderId);
  if (!orderIds.length) return false;
  const count = await this.orders.count({
    orderIds,
    status: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.FULFILLED],
  });
  return count > 0;
}

/**
 * Locks the quotations of an order's positions for the checkout and checks them again under the
 * lock: validateOrder runs before, so two carts holding the same quotation could both pass it.
 * The lock is held until processOrder persisted the order status, which reserves the quotations.
 */
export async function reserveOrderQuotationsForCheckout(this: Modules, order: Order) {
  const locks: { release: () => Promise<void> }[] = [];
  const release = async () => {
    await Promise.all(locks.map((lock) => lock.release()));
  };
  try {
    const positions = await this.orders.positions.findOrderPositions({ orderId: order._id });
    // Sorted, so two checkouts holding the same quotations lock them in the same order
    const quotationIds = [
      ...new Set(positions.map(({ quotationId }) => quotationId).filter(Boolean) as string[]),
    ].sort();
    for (const quotationId of quotationIds) {
      try {
        locks.push(await this.orders.acquireLock(quotationId, 'quotation', RESERVATION_LOCK_TTL));
      } catch (error) {
        if (!(error as Error)?.message?.startsWith('Could not acquire lock')) throw error;
        throw createServiceError('QuotationInvalidError', 'Quotation is being ordered by another order');
      }
      const quotation = await this.quotations.findQuotation({ quotationId });
      if (!quotation || !this.quotations.isProposalValid(quotation)) {
        throw createServiceError(
          'QuotationInvalidError',
          'Quotation expired, fulfilled or not valid for this order, please request a new offer',
        );
      }
      if (await isQuotationReserved.call(this, quotationId, { exceptOrderId: order._id })) {
        throw createServiceError('QuotationInvalidError', 'Quotation is reserved by another order');
      }
    }
    return { release };
  } catch (error) {
    await release();
    throw error;
  }
}
