import { type IPlugin } from '@unchainedshop/core';
import { PaymentUkTax } from './adapter.ts';

// Plugin definition
export const PaymentUkTaxPlugin: IPlugin = {
  key: 'shop.unchained.pricing.payment-uk-tax',
  label: 'Payment UK Tax Plugin',
  version: '1.0.0',

  adapters: [PaymentUkTax],
};

export default PaymentUkTaxPlugin;
