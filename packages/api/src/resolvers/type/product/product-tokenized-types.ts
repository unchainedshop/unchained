import { TokenizedProductHelperTypes } from '@unchainedshop/types/products';
import localePkg from 'locale';
import { PlanProduct } from './product-plan-types';

const { Locale } = localePkg;

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
    };
  },

  contractStandard(product) {
    return product.tokenization?.contractStandard;
  },

  async ercMetadata(product, { forceLocale }, context) {
    const locale = forceLocale ? new Locale(forceLocale) : context.localeContext;
    return context.services.products.ercMetadata({ product, locale }, context);
  },
};

delete TokenizedProduct.salesUnit;
delete TokenizedProduct.salesQuantityPerUnit;
delete TokenizedProduct.defaultOrderQuantity;
