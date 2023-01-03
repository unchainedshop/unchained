import { TokenizedProductHelperTypes } from '@unchainedshop/types/products.js';
import { WarehousingContext } from '@unchainedshop/types/warehousing.js';
import { PlanProduct } from './product-plan-types.js';

export const TokenizedProduct: TokenizedProductHelperTypes = {
  ...PlanProduct,

  contractAddress(product) {
    return product.tokenization?.contractAddress;
  },

  contractConfiguration(product) {
    if (!product.tokenization) return null;
    return {
      supply: product.tokenization.supply,
      tokenId: product.tokenization.tokenId,
      ercMetadataProperties: product.tokenization.ercMetadataProperties,
    };
  },

  contractStandard(product) {
    return product.tokenization?.contractStandard;
  },

  simulatedStocks: async (obj, params, requestContext) => {
    const { modules } = requestContext;
    const { referenceDate } = params;

    const deliveryProviders = await modules.delivery.findProviders({});

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
};

delete TokenizedProduct.salesUnit;
delete TokenizedProduct.salesQuantityPerUnit;
delete TokenizedProduct.defaultOrderQuantity;
