import { SimpleProductHelperTypes } from '@unchainedshop/types/products';
import { PlanProduct } from './plan-product-types';

export const SimpleProduct: SimpleProductHelperTypes = {
  ...PlanProduct,

  simulatedDispatches: async (obj, params, requestContext) => {
    const { deliveryProviderType } = params;
    const { modules } = requestContext;

    const deliveryProviders = await modules.delivery.findProviders({
      type: deliveryProviderType,
    });

    return deliveryProviders.reduce(async (oldResult, deliveryProvider) => {
      const result = await oldResult;

      const warehousingProviders = await modules.warehousing.findSupported({
        product: obj,
        deliveryProvider,
      });

      const mappedWarehousingProviders = warehousingProviders.map(
        (warehousingProvider) => {
          const context = {
            warehousingProvider,
            deliveryProvider,
            product: this,
            requestContext,
            ...options,
          };
          const dispatch = warehousingProvider.estimatedDispatch(context);
          return {
            ...context,
            ...dispatch,
          };
        }
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

      const warehousingProviders = await modules.warehousing.findSupported({
        product: this,
        deliveryProvider,
      });
      const mappedWarehousingProviders = warehousingProviders.map(
        (warehousingProvider) => {
          const context = {
            warehousingProvider,
            deliveryProvider,
            product: this,
            requestContext,
            ...options,
          };
          const stock = warehousingProvider.estimatedStock(context);
          return {
            ...context,
            ...stock,
          };
        }
      );

      return result.concat(result, mappedWarehousingProviders);
    }, Promise.all([]));
  },

  baseUnit: (obj) => {
    return obj.warehousing && obj.warehousing.baseUnit;
  },
  sku: (obj) => {
    return obj.warehousing && obj.warehousing.sku;
  },
  dimensions: ({ supply }) => {
    if (!supply) return null;
    const {
      weightInGram,
      heightInMillimeters,
      lengthInMillimeters,
      widthInMillimeters,
    } = supply;
    return {
      weightInGram,
      heightInMillimeters,
      lengthInMillimeters,
      widthInMillimeters,
    };
  },
};
