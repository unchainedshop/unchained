import {
  Product,
  ProductContractConfiguration,
  ProductContractStandard,
} from '@unchainedshop/core-products';
import { WarehousingContext, WarehousingProvider } from '@unchainedshop/core-warehousing';
import { Context } from '@unchainedshop/api';
import { DeliveryProvider } from '@unchainedshop/core-delivery';
import { PlanProduct } from './product-plan-types.js';
import { checkAction } from '../../../acl.js';
import { actions } from '../../../roles/index.js';

export const TokenizedProduct = {
  ...PlanProduct,

  contractAddress({ tokenization }: Product): string {
    return tokenization?.contractAddress;
  },

  contractConfiguration({ tokenization }: Product): ProductContractConfiguration {
    if (!tokenization) return null;
    return {
      supply: tokenization.supply,
      tokenId: tokenization.tokenId,
      ercMetadataProperties: tokenization.ercMetadataProperties,
    };
  },

  contractStandard({ tokenization }: Product): ProductContractStandard {
    return tokenization?.contractStandard;
  },

  async simulatedStocks(
    obj: Product,
    params: {
      referenceDate: Date;
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

  async tokens(product: Product, params: never, requestContext: Context) {
    await checkAction(requestContext, actions.viewTokens, [undefined, params]);

    const tokens = await requestContext.modules.warehousing.findTokens({
      productId: product._id,
    });
    return tokens;
  },
};

delete TokenizedProduct.salesUnit;
delete TokenizedProduct.salesQuantityPerUnit;
delete TokenizedProduct.defaultOrderQuantity;
