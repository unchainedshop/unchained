import {
  IProductPricingAdapter,
  IProductPricingDirector,
  ProductPricingAdapterContext,
  ProductPricingCalculation,
  ProductPricingContext,
} from '../types.js';
import { BasePricingDirector } from '@unchainedshop/utils';
import { ProductPricingSheet } from './ProductPricingSheet.js';

const baseDirector = BasePricingDirector<
  ProductPricingContext,
  ProductPricingAdapterContext,
  ProductPricingCalculation,
  IProductPricingAdapter
>('ProductPricingDirector');

export const ProductPricingDirector: IProductPricingDirector<any> = {
  ...baseDirector,

  async buildPricingContext(context, unchainedAPI) {
    const { modules } = unchainedAPI;

    if ('item' in context) {
      const { item } = context;
      const product = await modules.products.findProduct({
        productId: item.productId,
      });
      const order = await modules.orders.findOrder({
        orderId: item.orderId,
      });
      const user = await modules.users.findUserById(order.userId);
      const discounts = await modules.orders.discounts.findOrderDiscounts({
        orderId: item.orderId,
      });

      return {
        ...unchainedAPI,
        country: order.countryCode,
        currency: order.currency,
        discounts,
        order,
        product,
        quantity: item.quantity,
        configuration: item.configuration,
        user,
      };
    }

    return {
      ...unchainedAPI,
      country: context.country,
      currency: context.currency,
      discounts: [],
      order: context.order,
      product: context.product,
      quantity: context.quantity,
      configuration: context.configuration,
      user: context.user,
    };
  },

  calculationSheet(pricingContext, calculation) {
    // TODO: quantity?!
    return ProductPricingSheet({
      calculation,
      currency: pricingContext.currency,
      quantity: pricingContext.quantity,
    });
  },
};
