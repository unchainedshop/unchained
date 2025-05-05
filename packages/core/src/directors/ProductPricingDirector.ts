import { Product, ProductConfiguration } from '@unchainedshop/core-products';
import { User } from '@unchainedshop/core-users';
import { Order, OrderDiscount, OrderPosition } from '@unchainedshop/core-orders';
import {
  IProductPricingSheet,
  ProductPricingCalculation,
  ProductPricingSheet,
  IProductPricingAdapter,
  ProductPricingAdapterContext,
  BasePricingDirector,
  IPricingDirector,
} from '../directors/index.js';

export type ProductPricingContext =
  | {
      currencyCode: string;
      countryCode: string;
      quantity: number;
      discounts?: OrderDiscount[];
      order?: Order;
      product?: Product;
      configuration?: ProductConfiguration[];
      user?: User;
    }
  | {
      currencyCode: string;
      quantity: number;
      item: OrderPosition;
    };

const baseDirector = BasePricingDirector<
  ProductPricingContext,
  ProductPricingAdapterContext,
  ProductPricingCalculation,
  IProductPricingAdapter
>('ProductPricingDirector');

export type IProductPricingDirector<DiscountConfiguration = unknown> = IPricingDirector<
  ProductPricingContext,
  ProductPricingCalculation,
  ProductPricingAdapterContext,
  IProductPricingSheet,
  IProductPricingAdapter<DiscountConfiguration>
>;

export const ProductPricingDirector: IProductPricingDirector<any> = {
  ...baseDirector,

  async buildPricingContext(context, unchainedAPI) {
    const { modules } = unchainedAPI;
    const { quantity = 1, currencyCode } = context;

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
        countryCode: order.countryCode,
        currencyCode,
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
      countryCode: context.countryCode,
      currencyCode,
      discounts: [],
      order: context.order,
      product: context.product,
      quantity,
      configuration: context.configuration,
      user: context.user,
    };
  },

  calculationSheet(pricingContext, calculation) {
    return ProductPricingSheet({
      calculation,
      currencyCode: pricingContext.currencyCode,
      quantity: pricingContext.quantity ?? 1,
    });
  },
};
