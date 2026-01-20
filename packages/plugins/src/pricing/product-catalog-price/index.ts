import { type IPlugin } from '@unchainedshop/core';
import { ProductPrice } from './adapter.ts';

// Plugin definition
export const ProductPricePlugin: IPlugin = {
  key: 'shop.unchained.pricing.product-catalog',
  label: 'Product Catalog Price Plugin',
  version: '1.0.0',

  adapters: [ProductPrice],
};

export default ProductPricePlugin;

// Re-export adapter for direct use
export { ProductPrice } from './adapter.ts';
