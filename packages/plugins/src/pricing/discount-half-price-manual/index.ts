import { type IPlugin } from '@unchainedshop/core';
import { HalfPriceManual } from './adapter.ts';

// Plugin definition
export const HalfPriceManualPlugin: IPlugin = {
  key: 'shop.unchained.discount.half-price-manual',
  label: 'Half Price Manual Discount Plugin',
  version: '1.0.0',

  adapters: [HalfPriceManual],
};

export default HalfPriceManualPlugin;

// Re-export adapter for direct use
export { HalfPriceManual } from './adapter.ts';
