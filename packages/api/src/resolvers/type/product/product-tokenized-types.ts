import {
  Product,
  ProductContractConfiguration,
  ProductContractStandard,
} from '@unchainedshop/core-products';
import {
  WarehousingContext,
  WarehousingDirector,
  WarehousingProvider,
} from '@unchainedshop/core-warehousing';
import { Context } from '../../../context.js';
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
    const { modules, services } = requestContext;
    const { referenceDate } = params;

    const deliveryProviders = await modules.delivery.findProviders({});

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

          const director = await WarehousingDirector.actions(
            warehousingProvider,
            warehousingContext,
            requestContext,
          );
          const stock = await director.estimatedStock();

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
