import { type IPlugin } from '@unchainedshop/core';
import { UpdateECBRates, configureUpdateECBRatesAutoscheduling } from './adapter.ts';

// Plugin definition
export const UpdateECBRatesPlugin: IPlugin = {
  key: 'shop.unchained.worker.update-ecb-rates',
  label: 'Update ECB Rates Worker Plugin',
  version: '1.0.0',

  adapters: [UpdateECBRates],

  onRegister: () => {
    configureUpdateECBRatesAutoscheduling();
  },
};

export default UpdateECBRatesPlugin;

// Helpers
export { configureUpdateECBRatesAutoscheduling } from './adapter.ts';
