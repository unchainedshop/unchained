import { BasePricingDirector, IPricingDirector } from '@unchainedshop/utils';
import { Product, ProductConfiguration } from '@unchainedshop/core-products';
import { User } from '@unchainedshop/core-users';
import { Order, OrderDiscount, OrderPosition } from '@unchainedshop/core-orders';
import {
  IProductPricingSheet,
  ProductPricingCalculation,
  ProductPricingSheet,
  IProductPricingAdapter,
  ProductPricingAdapterContext,
} from '../directors/index.js';

export type ProductPricingContext =
  | {
      currency: string;
      quantity: number;
      country?: string;
      discounts?: Array<OrderDiscount>;
      order?: Order;
      product?: Product;
      configuration: Array<ProductConfiguration>;
      user?: User;
    }
  | {
      currency: string;
      quantity: number;
      item: OrderPosition;
    };

const baseDirector = BasePricingDirector<
  ProductPricingContext,
  ProductPricingAdapterContext,
  ProductPricingCalculation,
  IProductPricingAdapter
>('ProductPricingDirector');

export type IProductPricingDirector<
  UnchainedAPI = unknown,
  DiscountConfiguration = unknown,
> = IPricingDirector<
  ProductPricingContext,
  ProductPricingCalculation,
  ProductPricingAdapterContext,
  IProductPricingSheet,
  IProductPricingAdapter<any, DiscountConfiguration>,
  UnchainedAPI
>;

export const ProductPricingDirector: IProductPricingDirector<any> = {
  ...baseDirector,

  async buildPricingContext(context, unchainedAPI) {
    const { modules } = unchainedAPI;

    if ('item' in context) {
      const { item, quantity, currency } = context;
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
        currency,
        discounts,
        order,
        product,
        quantity,
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
    return ProductPricingSheet({
      calculation,
      currency: pricingContext.currency,
      quantity: pricingContext.quantity,
    });
  },
};
