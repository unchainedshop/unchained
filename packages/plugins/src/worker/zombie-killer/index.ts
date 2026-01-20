import { type IPlugin } from '@unchainedshop/core';
import { ZombieKillerWorker } from './adapter.ts';

// Plugin definition
export const ZombieKillerPlugin: IPlugin = {
  key: 'shop.unchained.worker-plugin.zombie-killer',
  label: 'Zombie Killer Worker Plugin',
  version: '1.0.0',

  adapters: [ZombieKillerWorker],
};

export default ZombieKillerPlugin;

// Re-export adapter for direct use
export { ZombieKillerWorker } from './adapter.ts';
