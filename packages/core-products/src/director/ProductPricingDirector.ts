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
    requestContext
  ) => {
    if (!orderPosition)
      return {
        discounts: [],
        ...pricingContext,
        ...requestContext,
      } as ProductPricingAdapterContext;

    const product = await requestContext.modules.products.findProduct({
      productId: orderPosition.productId,
    });

    const order = await requestContext.modules.orders.findOrder({
      orderId: orderPosition.orderId,
    });
    const user = await requestContext.modules.users.findUser({
      userId: order.userId,
    });
    const discounts = requestContext.modules.orders.positions.discounts(orderPosition, {
      currency: order.currency,
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
