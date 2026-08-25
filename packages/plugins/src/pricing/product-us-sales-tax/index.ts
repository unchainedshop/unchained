import { type IPlugin } from '@unchainedshop/core';
import { ProductUsSalesTax } from './adapter.ts';

// Plugin definition
export const ProductUsSalesTaxPlugin: IPlugin = {
  key: 'shop.unchained.pricing.product-us-sales-tax',
  label: 'Product US Sales Tax Plugin',
  version: '1.0.0',

  adapters: [ProductUsSalesTax],
};

export default ProductUsSalesTaxPlugin;

// Re-export adapter for direct use
export { ProductUsSalesTax } from './adapter.ts';
