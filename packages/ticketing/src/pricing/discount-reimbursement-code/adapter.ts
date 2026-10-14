import {
  type IDiscountAdapter,
  type OrderDiscountConfiguration,
  OrderDiscountAdapter,
  OrderPricingRowCategory,
  OrderPricingSheet,
} from '@unchainedshop/core';

export interface PassesModule {
  verifyDiscountCode: (code: string, currencyCode?: string) => Promise<number | null>;
  /** Amount already spent, in integer minor currency units. */
  discountCodeUsageBalance: (code: string, excludeOrderId?: string) => Promise<number>;
}

const resolveVoucher = ({ code, modules }: { code?: string; modules: unknown }) => {
  const passes = (modules as { passes?: Partial<PassesModule> }).passes;
  if (!code || !passes?.verifyDiscountCode || !passes.discountCodeUsageBalance) return null;
  return { code, passes: passes as PassesModule };
};

export const ReimbursementCode: IDiscountAdapter<OrderDiscountConfiguration> = {
  ...OrderDiscountAdapter,
  key: 'shop.unchained.discount.reimbursement-code',
  label: 'Reimbursement Code',
  version: '1.0.0',
  orderIndex: 2,
  isManualAdditionAllowed: async () => true,
  isManualRemovalAllowed: async () => true,

  actions: async ({ context }) => {
    const { order, orderDiscount, modules } = context;
    const voucher = resolveVoucher(context);
    const amount = voucher
      ? await voucher.passes.verifyDiscountCode(voucher.code, order.currencyCode)
      : null;
    const used =
      voucher && amount !== null
        ? await voucher.passes.discountCodeUsageBalance(voucher.code, order._id)
        : 0;
    const remaining = amount === null ? 0 : Math.max(0, amount - used);

    return {
      ...(await OrderDiscountAdapter.actions({ context })),

      reserveForCheckout: async () => {
        if (!voucher || !orderDiscount || amount === null) {
          throw new Error('INVALID_REIMBURSEMENT_CODE');
        }
        const checkoutAmount = Math.abs(
          OrderPricingSheet({ calculation: order.calculation, currencyCode: order.currencyCode }).sum({
            category: OrderPricingRowCategory.Discounts,
            discountId: orderDiscount._id,
          }),
        );
        const setCheckoutAmount = (value: number) =>
          modules.orders.discounts.update(orderDiscount._id, {
            reservation: { ...orderDiscount.reservation, checkoutAmount: value },
          });
        await using lock = await modules.orders.acquireLock(voucher.code, 'reimbursement');
        const spent = await voucher.passes.discountCodeUsageBalance(voucher.code, order._id);
        if (checkoutAmount > Math.max(0, amount - spent)) {
          throw new Error('DISCOUNT_USAGE_LIMIT_EXCEEDED');
        }
        if (!(await setCheckoutAmount(checkoutAmount))) {
          throw new Error('INVALID_REIMBURSEMENT_CODE');
        }
        return {
          release: async () => {
            await setCheckoutAmount(0);
          },
        };
      },

      isValidForSystemTriggering: async () => false,

      isValidForCodeTriggering: async () => {
        if (amount === null) return false;
        if (remaining) return true;
        // Exhausted vouchers are dropped from carts that hold them and rejected when newly added.
        if (orderDiscount?.reservation) return false;
        throw new Error('DISCOUNT_USAGE_LIMIT_EXCEEDED');
      },

      discountForPricingAdapterKey({ pricingAdapterKey }) {
        if (pricingAdapterKey !== 'shop.unchained.pricing.order-discount' || !remaining) return null;
        return { fixedRate: remaining };
      },
    };
  },
};
