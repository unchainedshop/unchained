import { type IPlugin } from '@unchainedshop/core';
import { PaymentEuTax } from './adapter.ts';

// Plugin definition
export const PaymentEuTaxPlugin: IPlugin = {
  key: 'shop.unchained.pricing.payment-eu-tax',
  label: 'Payment EU Tax Plugin',
  version: '1.0.0',

  adapters: [PaymentEuTax],
};

export default PaymentEuTaxPlugin;
