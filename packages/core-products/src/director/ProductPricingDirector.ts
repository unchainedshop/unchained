import { OrderPosition } from '@unchainedshop/types/orders.positions';
import {
  IProductPricingAdapter,
  IProductPricingDirector,
  ProductPricingAdapterContext,
  ProductPricingCalculation,
  ProductPricingContext,
} from '@unchainedshop/types/products.pricing';
import { BasePricingDirector } from 'meteor/unchained:utils';
import { ProductPricingSheet } from './ProductPricingSheet';

const baseDirector = BasePricingDirector<
  ProductPricingContext,
  ProductPricingAdapterContext,
  ProductPricingCalculation,
  IProductPricingAdapter
>('ProductPricingDirector');

export const ProductPricingDirector: IProductPricingDirector = {
  ...baseDirector,

  buildPricingContext: async (
    {
      item: orderPosition,
      ...pricingContext
    }: {
      item: OrderPosition;
    } & ProductPricingContext,
    requestContext,
  ) => {
    const { modules } = requestContext;

    if (!orderPosition) {
      return {
        discounts: [],
        ...pricingContext,
        ...requestContext,
      } as ProductPricingAdapterContext;
    }

    const product = await modules.products.findProduct({
      productId: orderPosition.productId,
    });

    const order = await modules.orders.findOrder({
      orderId: orderPosition.orderId,
    });
    const user = await modules.users.findUser({
      userId: order.userId,
    });
    const discounts = await modules.orders.discounts.findOrderDiscounts({
      orderId: orderPosition.orderId,
    });

    return {
      country: order.countryCode,
      currency: order.currency,
      discounts,
      order,
      product,
      quantity: orderPosition.quantity,
      user,
      ...requestContext,
    };
  },

  actions: async (pricingContext, requestContext) => {
    return baseDirector.actions(
      pricingContext,
      requestContext,
      ProductPricingDirector.buildPricingContext,
    );
  },

  resultSheet() {
    const calculation = baseDirector.getCalculation();
    const context = baseDirector.getContext();

    return ProductPricingSheet({
      calculation,
      currency: context.currency,
      quantity: context.quantity,
    });
  },
};
