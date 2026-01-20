import { type IPlugin } from '@unchainedshop/core';
import { ProductSwissTax } from './adapter.ts';

// Plugin definition
export const ProductSwissTaxPlugin: IPlugin = {
  key: 'shop.unchained.pricing.product-swiss-tax',
  label: 'Product Swiss Tax Plugin',
  version: '1.0.0',

  adapters: [ProductSwissTax],
};

export default ProductSwissTaxPlugin;

// Re-export adapter for direct use
export { ProductSwissTax } from './adapter.ts';
