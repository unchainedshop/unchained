import type {
  Product,
  ProductContractConfiguration,
  ProductContractStandard,
} from '@unchainedshop/core-products';
import type { WarehousingProvider } from '@unchainedshop/core-warehousing';
import type { DeliveryProvider } from '@unchainedshop/core-delivery';

import type { Context } from '../../../context.ts';
import { PlanProduct } from './product-plan-types.ts';
import { checkAction } from '../../../acl.ts';
import { actions } from '../../../roles/index.ts';

export const TokenizedProduct = {
  ...PlanProduct,

  contractAddress({ tokenization }: Product): string | null {
    return tokenization?.contractAddress || null;
  },

  contractConfiguration({ tokenization }: Product): ProductContractConfiguration | null {
    if (!tokenization) return null;
    return {
      supply: tokenization.supply,
      tokenId: tokenization.tokenId,
      ercMetadataProperties: tokenization.ercMetadataProperties,
    };
  },

  contractStandard({ tokenization }: Product): ProductContractStandard | null {
    return tokenization?.contractStandard || null;
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

  isCanceled(product: Product): boolean {
    return Boolean(product.meta?.cancelled);
  },

  async tokens(product: Product, params: never, requestContext: Context) {
    try {
      await checkAction(requestContext, actions.viewTokens, [undefined, params]);
    } catch {
      const passCode = requestContext.getCookie?.('unchained_gate_passcode');
      const ticketingServices = (requestContext.services as any)?.ticketing;
      const isValid = await ticketingServices?.isPassCodeValid?.(passCode, product._id);
      if (!isValid) return [];
    }
    const tokens = await requestContext.modules.warehousing.findTokens({
      productId: product._id,
    });
    return tokens;
  },
  async tokensCount(product: Product, params: never, requestContext: Context) {
    try {
      await checkAction(requestContext, actions.viewTokens, [undefined, params]);
    } catch {
      const passCode = requestContext.getCookie?.('unchained_gate_passcode');
      const ticketingServices = (requestContext.services as any)?.ticketing;
      const isValid = await ticketingServices?.isPassCodeValid?.(passCode, product._id);
      if (!isValid) return 0;
    }
    return requestContext.modules.warehousing.tokensCount({
      productId: product._id,
    });
  },

  async scannerPassCode(product: Product, params: never, requestContext: Context) {
    await checkAction(requestContext, actions.manageProducts, [undefined, params]);
    return (product.meta as Record<string, any>)?.scannerPassCode || null;
  },
};

delete (TokenizedProduct as any).salesUnit;
delete (TokenizedProduct as any).salesQuantityPerUnit;
delete (TokenizedProduct as any).defaultOrderQuantity;
