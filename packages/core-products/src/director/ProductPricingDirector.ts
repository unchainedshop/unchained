import { OrderDelivery, OrderPosition } from '@unchainedshop/types/orders';
import {
  ProductPricingAdapterContext,
  ProductPricingCalculation,
  ProductPricingContext,
  IProductPricingAdapter,
  IProductPricingDirector,
} from '@unchainedshop/types/products.pricing';
import { BasePricingDirector } from 'meteor/unchained:utils';
import { ProductPricingSheet } from './ProductPricingSheet';

const baseDirector = BasePricingDirector<
  ProductPricingContext,
  ProductPricingAdapterContext,
  ProductPricingCalculation,
  IProductPricingAdapter
>();

export const ProductPricingDirector: IProductPricingDirector = {
  ...baseDirector,

  buildPricingContext: (
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

    // TODO: use modules
    /* @ts-ignore */
    const product = orderPosition.product();
    // TODO: use modules
    /* @ts-ignore */
    const order = orderPosition.order();
    const user = order.user();
    const discounts = order.discounts();

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
