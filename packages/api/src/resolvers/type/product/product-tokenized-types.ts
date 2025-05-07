import {
  Product,
  ProductContractConfiguration,
  ProductContractStandard,
} from '@unchainedshop/core-products';
import { WarehousingProvider } from '@unchainedshop/core-warehousing';
import { DeliveryProvider } from '@unchainedshop/core-delivery';

import { Context } from '../../../context.js';
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
