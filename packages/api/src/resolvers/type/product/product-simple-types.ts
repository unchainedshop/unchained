import { SimpleProductHelperTypes } from '@unchainedshop/types/products';
import { PlanProduct } from './product-plan-types';

export const SimpleProduct: SimpleProductHelperTypes = {
  ...PlanProduct,

  simulatedDispatches: async (obj, params, requestContext) => {
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
          const warehousingContext = {
            deliveryProvider,
            product: obj,
            quantity,
            referenceDate,
            warehousingProvider,
          };

          const dispatch = await modules.warehousing.estimatedDispatch(
            warehousingProvider,
            warehousingContext,
            requestContext,
          );

          return {
            ...warehousingContext,
            ...dispatch,
          };
        }),
      );

      return result.concat(result, mappedWarehousingProviders);
    }, Promise.resolve([]));
  },

  simulatedStocks: async (obj, params, requestContext) => {
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
          const warehousingContext = {
            deliveryProvider,
            product: obj,
            referenceDate,
            warehousingProvider,
          };

          const stock = await modules.warehousing.estimatedStock(
            warehousingProvider,
            warehousingContext,
            requestContext,
          );

          return {
            ...warehousingContext,
            ...stock,
          };
        }),
      );

      return result.concat(result, mappedWarehousingProviders);
    }, Promise.resolve([]));
  },

  baseUnit: (obj) => {
    return obj.warehousing && obj.warehousing.baseUnit;
  },
  sku: (obj) => {
    return obj.warehousing && obj.warehousing.sku;
  },
  dimensions: ({ supply }) => {
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
