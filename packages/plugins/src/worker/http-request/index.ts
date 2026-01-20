import { type IPlugin } from '@unchainedshop/core';
import { HttpRequestWorkerPlugin as HttpRequestWorker } from './adapter.ts';

// Plugin definition
export const HttpRequestPlugin: IPlugin = {
  key: 'shop.unchained.worker-plugin.http-request',
  label: 'HTTP Request Worker Plugin',
  version: '1.0.0',

  adapters: [HttpRequestWorker],
};

export default HttpRequestPlugin;

// Re-export adapter for direct use
export { HttpRequestWorkerPlugin } from './adapter.ts';
