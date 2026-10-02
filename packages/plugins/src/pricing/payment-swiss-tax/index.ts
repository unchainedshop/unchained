import { type IPlugin } from '@unchainedshop/core';
import { PaymentSwissTax } from './adapter.ts';

// Plugin definition
export const PaymentSwissTaxPlugin: IPlugin = {
  key: 'shop.unchained.pricing.payment-swiss-tax',
  label: 'Payment Swiss Tax Plugin',
  version: '1.0.0',

  adapters: [PaymentSwissTax],
};

export default PaymentSwissTaxPlugin;
