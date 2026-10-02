import { PaymentAdapter, type IPaymentAdapter } from '@unchainedshop/core';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import { BOX_OFFICE_PAYMENT_ADAPTER_KEY, canUserSellAtBoxOffice } from '../../box-office.ts';

/**
 * Tickets sold at the box office: the money is taken at the counter, so the order is paid when it
 * is checked out. Only staff with sellAtBoxOffice may check out with it; withTicketing hides the
 * provider from everyone else.
 */
export const BoxOffice: IPaymentAdapter = {
  ...PaymentAdapter,

  key: BOX_OFFICE_PAYMENT_ADAPTER_KEY,
  label: 'Box office (paid at the counter)',
  version: '1.0.0',

  initialConfiguration: [],

  typeSupported: (type) => type === PaymentProviderType.GENERIC,

  actions: (config, context) => ({
    ...PaymentAdapter.actions(config, context),

    configurationError: () => null,

    isActive: () => true,

    isPayLaterAllowed: () => false,

    // Checkout does not filter the providers again, so the permission is checked here
    charge: async () => {
      const userId = context.userId ?? context.order?.userId;
      if (!(await canUserSellAtBoxOffice(userId, context.modules))) {
        throw new Error('Only box office staff may check out with the box office payment provider', {
          cause: 'BOX_OFFICE_NOT_ALLOWED',
        });
      }
      return { boxOffice: true };
    },
  }),
};
