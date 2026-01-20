import { type IPlugin } from '@unchainedshop/core';
import { Heartbeat } from './adapter.ts';

// Plugin definition
export const HeartbeatPlugin: IPlugin = {
  key: 'shop.unchained.worker-plugin.heartbeat',
  label: 'Heartbeat Worker Plugin',
  version: '1.0.0',

  adapters: [Heartbeat],
};

export default HeartbeatPlugin;

// Re-export adapter for direct use
export { Heartbeat } from './adapter.ts';
