import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { PaymentProviderType } from '@unchainedshop/core-payment';

export default async function paymentProviders(
  root: never,
  params: {
    type?: PaymentProviderType | null;
  },
  { modules, userId }: Context,
) {
  log(`query paymentProviders ${params.type}`, { userId });

  return modules.payment.paymentProviders.findProviders(
    params.type
      ? {
          type: params.type,
        }
      : {},
  );
}
