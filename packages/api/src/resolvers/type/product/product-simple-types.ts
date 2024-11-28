import { Product, ProductSupply } from '@unchainedshop/core-products';
import {
  WarehousingContext,
  WarehousingDirector,
  WarehousingProvider,
} from '@unchainedshop/core-warehousing';
import { Context } from '../../../context.js';
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
    const { modules, services } = requestContext;

    const deliveryProviders = await modules.delivery.findProviders({
      type: deliveryProviderType,
    });

    return deliveryProviders.reduce(async (oldResult, deliveryProvider) => {
      const result = await oldResult;

      const warehousingProviders = await services.orders.supportedWarehousingProviders(
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

          const director = await WarehousingDirector.actions(
            warehousingProvider,
            warehousingContext,
            requestContext,
          );
          const dispatch = await director.estimatedDispatch();

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
    const { modules, services } = requestContext;
    const { referenceDate, deliveryProviderType } = params;

    const deliveryProviders = await modules.delivery.findProviders({
      type: deliveryProviderType,
    });

    return deliveryProviders.reduce(async (oldResult, deliveryProvider) => {
      const result = await oldResult;

      const warehousingProviders = await services.orders.supportedWarehousingProviders(
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
