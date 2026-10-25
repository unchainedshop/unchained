import { pluginRegistry, registerPaymentProvider } from '@unchainedshop/core';

export const SCRIPTED_ADAPTER = 'shop.unchained.payment.ucp-scripted';

export const scriptedHandler = {
  name: 'dev.unchained.test.scripted',
  version: '2026-10-20',
  spec: 'https://docs.unchained.shop/ai-integration/ucp',
  instrumentType: 'card',
  adapterKeys: [SCRIPTED_ADAPTER],
  paymentContext: (instrument) => ({ outcome: instrument.credential?.token }),
};

export const charges = [];

export function registerScriptedPsp() {
  if (pluginRegistry.hasPlugin(SCRIPTED_ADAPTER)) return;
  registerPaymentProvider({
    adapterId: 'ucp-scripted',
    charge: async (configuration, { transactionContext, orderPayment }) => {
      charges.push({ orderPaymentId: orderPayment._id, outcome: transactionContext.outcome });
      if (transactionContext.outcome?.startsWith('paid'))
        return { transactionId: `scripted-${charges.length}` };
      if (transactionContext.outcome === 'challenge') {
        throw new Error('The issuer asks for authentication', { cause: 'PAYMENT_REQUIRES_ACTION' });
      }
      throw new Error('The card was declined', { cause: 'PAYMENT_DECLINED' });
    },
  });
}

export const scriptedProvider = {
  _id: 'ucp-scripted-provider',
  adapterKey: SCRIPTED_ADAPTER,
  type: 'GENERIC',
  configuration: [],
  created: new Date(),
};
