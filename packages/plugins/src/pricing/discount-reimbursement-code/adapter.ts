import {
  OrderDiscountAdapter,
  type OrderDiscountConfiguration,
  type IDiscountAdapter,
} from '@unchainedshop/core';

export interface PassesModule {
  verifyDiscountCode: (code: string) => Promise<number | null>;
  discountCodeUsageBalance: (code: string) => Promise<number>;
}

const getPassesModule = (modules: Record<string, unknown>): PassesModule | null => {
  const passes = modules.passes as PassesModule | undefined;
  if (!passes?.verifyDiscountCode || !passes?.discountCodeUsageBalance) return null;
  return passes;
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
    const passes = getPassesModule(context.modules as unknown as Record<string, unknown>);

    const discountAmount = passes ? await passes.verifyDiscountCode(context.code!) : null;

    const remainingDiscount = async (): Promise<number> => {
      if (!passes || discountAmount === null) return 0;
      const used = await passes.discountCodeUsageBalance(context.code!);
      const value = (discountAmount || 0) / 100;
      return Math.max(0, Math.round((value - used) / value));
    };

    const orderPositions = await context.modules.orders.positions.findOrderPositions({
      orderId: context?.order?._id as string,
    });

    const totalTickets = (orderPositions || []).reduce(
      (sum, { quantity }) => sum + quantity,
      0,
    );

    return {
      ...(await OrderDiscountAdapter.actions({ context })),

      reserve: async () => {
        const remaining = await remainingDiscount();
        return { remainingDiscount: remaining };
      },

      isValidForSystemTriggering: async () => false,

      isValidForCodeTriggering: async () => {
        if (discountAmount === null) return false;

        const remaining = await remainingDiscount();
        const reservation = context.orderDiscount?.reservation;

        if (!remaining) {
          if (reservation) return false;
          throw new Error('DISCOUNT_USAGE_LIMIT_EXCEEDED');
        }

        if (reservation) {
          const reservedItems = Math.max(0, Math.min(reservation.remainingDiscount, totalTickets));
          const currentItems = Math.max(0, Math.min(remaining, totalTickets));
          if (currentItems < reservedItems) return false;
        }

        return true;
      },

      discountForPricingAdapterKey({ pricingAdapterKey }) {
        if (pricingAdapterKey !== 'shop.unchained.pricing.order-discount') return null;
        if (discountAmount === null) return null;
        return { fixedRate: discountAmount };
      },
    };
  },
};

export default ReimbursementCode;
