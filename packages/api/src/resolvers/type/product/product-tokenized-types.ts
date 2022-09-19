import { ProductContractStandard, TokenizedProductHelperTypes } from '@unchainedshop/types/products';
import { PlanProduct } from './product-plan-types';

export const TokenizedProduct: TokenizedProductHelperTypes = {
  ...PlanProduct,
  contractAddress() {
    return '0x0';
  },
  contractConfiguration() {
    return null;
  },
  contractStandard() {
    return ProductContractStandard.ERC1155;
  },
};

delete TokenizedProduct.salesUnit;
delete TokenizedProduct.salesQuantityPerUnit;
delete TokenizedProduct.defaultOrderQuantity;
