import type { Product, ProductSupply } from '@unchainedshop/core-products';
import type { Context } from '../../../context.ts';
import type { DeliveryProviderType } from '@unchainedshop/core-delivery';
import type { DeliveryProvider } from '@unchainedshop/core-delivery';
import { PlanProduct } from './product-plan-types.ts';
import type { WarehousingProvider } from '@unchainedshop/core-warehousing';

export const SimpleProduct = {
  ...PlanProduct,

  async simulatedDispatches(
    obj: Product,
    params: { referenceDate: Date; quantity: number; deliveryProviderType: DeliveryProviderType | null },
    requestContext: Context,
  ): Promise<
    {
      deliveryProvider?: DeliveryProvider;
      warehousingProvider?: WarehousingProvider;
      shipping?: Date;
      earliestDelivery?: Date;
    }[]
  > {
    const { referenceDate, quantity, deliveryProviderType } = params;
    const { services } = requestContext;
    return services.products.simulateProductDispatching({
      product: obj,
      quantity,
      referenceDate,
      deliveryProviderType,
    });
  },

  async simulatedStocks(
    obj: Product,
    params: {
      referenceDate: Date;
      deliveryProviderType: DeliveryProviderType | null;
    },
    requestContext: Context,
  ): Promise<
    {
      deliveryProvider?: DeliveryProvider;
      warehousingProvider?: WarehousingProvider;
      quantity?: number;
    }[]
  > {
    const { services } = requestContext;
    const { referenceDate, deliveryProviderType } = params;
    return services.products.simulateProductInventory({
      product: obj,
      referenceDate,
      deliveryProviderType,
    });
  },

  baseUnit({ warehousing }): string {
    return warehousing?.baseUnit;
  },

  sku({ warehousing }): string {
    return warehousing?.sku;
  },

  dimensions({ supply }): ProductSupply | null {
    if (!supply) return null;
    const { weightInGram, heightInMillimeters, lengthInMillimeters, widthInMillimeters } = supply;
    return {
      weightInGram,
      heightInMillimeters,
      lengthInMillimeters,
      widthInMillimeters,
    };
  },
};
