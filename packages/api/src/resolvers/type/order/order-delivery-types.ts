import { DeliveryPricingSheet } from '@unchainedshop/core';
import type { OrderDelivery as OrderDeliveryType } from '@unchainedshop/core-orders';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import type { Context } from '../../../context.ts';

export const OrderDelivery = {
  __resolveType: async (obj: OrderDeliveryType, { loaders }: Context) => {
    const provider = await loaders.deliveryProviderLoader.load({
      deliveryProviderId: obj.deliveryProviderId,
    });

    switch (provider?.type) {
      case DeliveryProviderType.PICKUP:
        return 'OrderDeliveryPickUp';
      default:
        return 'OrderDeliveryShipping';
    }
  },
};

// The gross amount the order charges for the delivery (fees, discounts and taxes), the
// same amount the order-level DELIVERY row carries. null while the delivery is not priced.
export const orderDeliveryFee = async (obj: OrderDeliveryType, _: never, { loaders }: Context) => {
  const order = await loaders.orderLoader.load({ orderId: obj.orderId });
  const pricing = DeliveryPricingSheet({
    calculation: obj.calculation,
    currencyCode: order.currencyCode,
  });
  if (!pricing.isValid()) return null;
  return { ...pricing.total(), isTaxable: pricing.taxSum() > 0, isNetPrice: false };
};
