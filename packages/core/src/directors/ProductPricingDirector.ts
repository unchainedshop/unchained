import type { Product, ProductConfiguration } from '@unchainedshop/core-products';
import type { User } from '@unchainedshop/core-users';
import type { Order, OrderDiscount, OrderPosition } from '@unchainedshop/core-orders';
import {
  type IProductPricingSheet,
  type ProductPricingCalculation,
  ProductPricingSheet,
} from './ProductPricingSheet.ts';
import {
  type IProductPricingAdapter,
  type ProductPricingAdapterContext,
  ProductPricingAdapter,
} from './ProductPricingAdapter.ts';
import { BasePricingDirector, type IPricingDirector } from './BasePricingDirector.ts';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';
export type ProductPricingContext =
  | {
      currencyCode: string;
      countryCode: string;
      quantity: number;
      discounts: OrderDiscount[];
      order?: Order;
      product: Product;
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

  // Override to query pluginRegistry dynamically
  getAdapter: (key: string) => {
    const adapters = pluginRegistry.getAdapters(
      ProductPricingAdapter.adapterType!,
    ) as IProductPricingAdapter[];
    return adapters.find((adapter) => adapter.key === key) || null;
  },

  // Override to query pluginRegistry dynamically
  getAdapters: ({ adapterFilter } = {}) => {
    const adapters = pluginRegistry.getAdapters(
      ProductPricingAdapter.adapterType!,
    ) as IProductPricingAdapter[];
    return adapters.filter(adapterFilter || (() => true));
  },

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
      const user = await modules.users.findUserById(order!.userId);
      const discounts = await modules.orders.discounts.findOrderDiscounts({
        orderId: item.orderId,
      });

      return {
        ...unchainedAPI,
        countryCode: order!.countryCode,
        currencyCode,
        discounts,
        order: order!,
        product: product!,
        quantity,
        configuration: item.configuration ?? null,
        user: user!,
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
      configuration: context.configuration ?? null,
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
