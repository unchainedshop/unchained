import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { PaymentProvider } from '@unchainedshop/core-payment';

export default async function paymentProvidersCount(
  root: never,
  params: {
    type?: PaymentProvider | null;
  },
  { modules, userId }: Context,
) {
  log(`query paymentProvidersCount ${params.type}`, { userId });

  return modules.payment.paymentProviders.count(
    params.type
      ? {
          type: params.type,
        }
      : {},
  );
}
