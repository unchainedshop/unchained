import { Product, ProductSupply } from '@unchainedshop/core-products';
import { Context } from '../../../context.js';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { DeliveryProvider } from '@unchainedshop/core-delivery';
import { PlanProduct } from './product-plan-types.js';
import { WarehousingProvider } from '@unchainedshop/core-warehousing';

export const SimpleProduct = {
  ...PlanProduct,

  async simulatedDispatches(
    obj: Product,
    params: { referenceDate: Date; quantity: number; deliveryProviderType: DeliveryProviderType },
    requestContext: Context,
  ): Promise<
    {
      deliveryProvider?: DeliveryProvider;
      warehousingProvider?: WarehousingProvider;
      shipping?: Date;
      earliestDelivery?: Date;
    }[]
  > {
    const { referenceDate, quantity } = params;
    const { services } = requestContext;
    return services.products.simulateProductDispatching({
      product: obj,
      quantity,
      referenceDate,
    });
  },

  async simulatedStocks(
    obj: Product,
    params: {
      referenceDate: Date;
      deliveryProviderType: DeliveryProviderType;
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
    const { referenceDate } = params;
    return services.products.simulateProductInventory({
      product: obj,
      referenceDate,
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
