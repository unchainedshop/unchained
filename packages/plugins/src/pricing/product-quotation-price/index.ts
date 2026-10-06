import { type IPlugin } from '@unchainedshop/core';
import { ProductQuotationPrice } from './adapter.ts';

// Plugin definition
export const ProductQuotationPricePlugin: IPlugin = {
  key: 'shop.unchained.pricing.product-quotation-price',
  label: 'Product Quotation Price Plugin',
  version: '1.0.0',

  adapters: [ProductQuotationPrice],
};

export default ProductQuotationPricePlugin;
