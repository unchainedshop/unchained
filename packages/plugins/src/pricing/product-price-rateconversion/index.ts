import { type IPlugin } from '@unchainedshop/core';
import { ProductPriceRateConversion } from './adapter.ts';

// Plugin definition
export const ProductPriceRateConversionPlugin: IPlugin = {
  key: 'shop.unchained.pricing.rate-conversion',
  label: 'Product Price Rate Conversion Plugin',
  version: '1.0.0',

  adapters: [ProductPriceRateConversion],
};

export default ProductPriceRateConversionPlugin;

// Re-export adapter for direct use
export { ProductPriceRateConversion } from './adapter.ts';
