import { Product, ProductSupply } from '@unchainedshop/types/products.js';
import { WarehousingContext, WarehousingProvider } from '@unchainedshop/types/warehousing.js';
import { Context } from '@unchainedshop/api';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { DeliveryProvider } from '@unchainedshop/core-delivery';
import { PlanProduct } from './product-plan-types.js';

export const SimpleProduct = {
  ...PlanProduct,

  async simulatedDispatches(
    obj: Product,
    params: { referenceDate: Date; quantity: number; deliveryProviderType: DeliveryProviderType },
    requestContext: Context,
  ): Promise<
    Array<{
      _id: string;
      deliveryProvider?: DeliveryProvider;
      warehousingProvider?: WarehousingProvider;
      shipping?: Date;
      earliestDelivery?: Date;
    }>
  > {
    const { deliveryProviderType, referenceDate, quantity } = params;
    const { modules } = requestContext;

    const deliveryProviders = await modules.delivery.findProviders({
      type: deliveryProviderType,
    });

    return deliveryProviders.reduce(async (oldResult, deliveryProvider) => {
      const result = await oldResult;

      const warehousingProviders = await modules.warehousing.findSupported(
        {
          product: obj,
          deliveryProvider,
        },
        requestContext,
      );

      const mappedWarehousingProviders = await Promise.all(
        warehousingProviders.map(async (warehousingProvider) => {
          const warehousingContext: WarehousingContext = {
            deliveryProvider,
            product: obj,
            quantity,
            referenceDate,
          };

          const dispatch = await modules.warehousing.estimatedDispatch(
            warehousingProvider,
            warehousingContext,
            requestContext,
          );

          return {
            warehousingProvider,
            ...warehousingContext,
            ...dispatch,
          };
        }),
      );

      return result.concat(result, mappedWarehousingProviders);
    }, Promise.resolve([]));
  },

  async simulatedStocks(
    obj: Product,
    params: {
      referenceDate: Date;
      deliveryProviderType: DeliveryProviderType;
    },
    requestContext: Context,
  ): Promise<
    Array<{
      _id: string;
      deliveryProvider?: DeliveryProvider;
      warehousingProvider?: WarehousingProvider;
      quantity?: number;
    }>
  > {
    const { modules } = requestContext;
    const { referenceDate, deliveryProviderType } = params;

    const deliveryProviders = await modules.delivery.findProviders({
      type: deliveryProviderType,
    });

    return deliveryProviders.reduce(async (oldResult, deliveryProvider) => {
      const result = await oldResult;

      const warehousingProviders = await modules.warehousing.findSupported(
        {
          product: obj,
          deliveryProvider,
        },
        requestContext,
      );

      const mappedWarehousingProviders = await Promise.all(
        warehousingProviders.map(async (warehousingProvider) => {
          const warehousingContext: WarehousingContext = {
            deliveryProvider,
            product: obj,
            referenceDate,
          };

          const stock = await modules.warehousing.estimatedStock(
            warehousingProvider,
            warehousingContext,
            requestContext,
          );

          return {
            warehousingProvider,
            ...warehousingContext,
            ...stock,
          };
        }),
      );

      return result.concat(result, mappedWarehousingProviders);
    }, Promise.resolve([]));
  },

  baseUnit({ warehousing }): string {
    return warehousing?.baseUnit;
  },

  sku({ warehousing }): string {
    return warehousing?.sku;
  },

  dimensions({ supply }): ProductSupply {
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
