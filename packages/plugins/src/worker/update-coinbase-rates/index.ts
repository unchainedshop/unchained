import { type IPlugin } from '@unchainedshop/core';
import { UpdateCoinbaseRates, configureUpdateCoinbaseRatesAutoscheduling } from './adapter.ts';

// Plugin definition
export const UpdateCoinbaseRatesPlugin: IPlugin = {
  key: 'shop.unchained.worker.update-coinbase-rates',
  label: 'Update Coinbase Rates Worker Plugin',
  version: '1.0.0',

  adapters: [UpdateCoinbaseRates],

  onRegister: () => {
    configureUpdateCoinbaseRatesAutoscheduling();
  },
};

export default UpdateCoinbaseRatesPlugin;

// Re-export adapter for direct use
export { UpdateCoinbaseRates, configureUpdateCoinbaseRatesAutoscheduling } from './adapter.ts';
