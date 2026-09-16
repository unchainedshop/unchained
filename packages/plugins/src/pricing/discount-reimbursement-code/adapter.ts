import {
  OrderDiscountAdapter,
  type OrderDiscountConfiguration,
  type IDiscountAdapter,
} from '@unchainedshop/core';

export interface PassesModule {
  verifyDiscountCode: (code: string, currencyCode?: string) => Promise<number | null>;
  /** Amount already spent, in integer minor currency units. */
  discountCodeUsageBalance: (code: string, excludeOrderId?: string) => Promise<number>;
}

export const ReimbursementCode: IDiscountAdapter<OrderDiscountConfiguration> = {
  ...OrderDiscountAdapter,
  key: 'shop.unchained.discount.reimbursement-code',
  label: 'Reimbursement Code',
  version: '1.0.0',
  orderIndex: 2,
  isManualAdditionAllowed: async () => true,
  isManualRemovalAllowed: async () => true,

  actions: async ({ context }) => {
    const passes = (context.modules as unknown as { passes?: Partial<PassesModule> }).passes;
    const amount =
      context.code && passes?.verifyDiscountCode && passes?.discountCodeUsageBalance
        ? await passes.verifyDiscountCode(context.code, context.order.currencyCode)
        : null;
    const used =
      amount !== null && passes?.discountCodeUsageBalance
        ? await passes.discountCodeUsageBalance(context.code!, context.order._id)
        : 0;
    const remaining = amount === null ? 0 : Math.max(0, amount - used);

    return {
      ...(await OrderDiscountAdapter.actions({ context })),
      reserve: async () => ({ remainingDiscount: remaining }),
      prepareForCheckout: async () => {
        const { order, orderDiscount, modules, code } = context;
        if (!orderDiscount || !code || amount === null || !passes?.discountCodeUsageBalance) {
          throw new Error('INVALID_REIMBURSEMENT_CODE');
        }
        const checkoutAmount = Math.abs(
          (order.calculation || []).reduce(
            (total, row) =>
              row.category === 'DISCOUNTS' && row.discountId === orderDiscount._id
                ? total + row.amount
                : total,
            0,
          ),
        );
        const release = async () => {
          await modules.orders.discounts.update(orderDiscount._id, {
            reservation: { ...orderDiscount.reservation, checkoutAmount: 0 },
          });
        };
        // Serialize the read-and-reserve step across carts and processes. Persist
        // the reservation before releasing the lock, so slow payment providers
        // cannot outlive a lock lease and allow the credit to be spent twice.
        const lock = await modules.orders.acquireLock(code, 'reimbursement', 60000);
        try {
          const spent = await passes.discountCodeUsageBalance(code, order._id);
          if (checkoutAmount > Math.max(0, amount - spent))
            throw new Error('DISCOUNT_USAGE_LIMIT_EXCEEDED');
          const reserved = await modules.orders.discounts.update(orderDiscount._id, {
            reservation: { ...orderDiscount.reservation, checkoutAmount },
          });
          if (!reserved) throw new Error('INVALID_REIMBURSEMENT_CODE');
        } finally {
          await lock.release();
        }
        return { release };
      },
      isValidForSystemTriggering: async () => false,
      isValidForCodeTriggering: async () => {
        if (amount === null) return false;
        if (!remaining) {
          if (context.orderDiscount?.reservation) return false;
          throw new Error('DISCOUNT_USAGE_LIMIT_EXCEEDED');
        }
        return true;
      },
      discountForPricingAdapterKey({ pricingAdapterKey }) {
        if (pricingAdapterKey !== 'shop.unchained.pricing.order-discount' || !remaining) return null;
        return { fixedRate: remaining };
      },
    };
  },
};

export default ReimbursementCode;
