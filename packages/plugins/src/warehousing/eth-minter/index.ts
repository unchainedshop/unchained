import { type IPlugin } from '@unchainedshop/core';
import { ETHMinter } from './adapter.ts';

// Plugin definition
export const ETHMinterPlugin: IPlugin = {
  key: 'shop.unchained.warehousing.infinite-minter',
  label: 'ETH Infinite Minter Warehousing Plugin',
  version: '1.0.0',

  adapters: [ETHMinter],
};

export default ETHMinterPlugin;

// Re-export adapter for direct use
export { ETHMinter } from './adapter.ts';
