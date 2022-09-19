import { TokenizedProductHelperTypes } from '@unchainedshop/types/products';
import { PlanProduct } from './product-plan-types';

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
};

delete TokenizedProduct.salesUnit;
delete TokenizedProduct.salesQuantityPerUnit;
delete TokenizedProduct.defaultOrderQuantity;
