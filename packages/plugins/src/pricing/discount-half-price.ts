import {
  OrderDiscountDirector,
  OrderDiscountAdapter,
  ProductDiscountConfiguration,
  IDiscountAdapter,
  UnchainedCore,
} from '@unchainedshop/core';

export const HalfPrice: IDiscountAdapter<ProductDiscountConfiguration, UnchainedCore> = {
  ...OrderDiscountAdapter,

  key: 'shop.unchained.discount.half-price',
  label: 'Half Price',
  version: '1.0.0',
  orderIndex: 10,

  // return true if a discount is allowed to get added manually by a user
  isManualAdditionAllowed: async () => {
    return false;
  },

  // return true if a discount is allowed to get removed manually by a user
  isManualRemovalAllowed: async () => {
    return false;
  },

  actions: async ({ context }) => ({
    ...(await OrderDiscountAdapter.actions({ context })),

    isValidForSystemTriggering: async () => {
      const { order } = context;
      const user = await context.modules.users.findUserById(order.userId);
      const isUserEligibleForHalfPrice = user?.tags && user.tags.indexOf('half-price') !== -1;
      return !!isUserEligibleForHalfPrice;
    },

    isValidForCodeTriggering: async () => {
      return false;
    },

    // returns the appropriate discount context for a calculation adapter
    discountForPricingAdapterKey({ pricingAdapterKey }) {
      if (pricingAdapterKey === 'shop.unchained.pricing.product-discount') {
        return { rate: 0.5 };
      }
      return null;
    },
  }),
};

OrderDiscountDirector.registerAdapter(HalfPrice);
