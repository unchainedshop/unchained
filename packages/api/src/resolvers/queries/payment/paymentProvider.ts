import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { InvalidIdError } from '../../../errors.js';

export default async function paymentProvider(
  root: never,
  { paymentProviderId }: { paymentProviderId: string },
  { modules, userId }: Context,
) {
  log(`query paymentProvider ${paymentProviderId}`, { userId });

  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });

  return modules.payment.paymentProviders.findProvider({
    paymentProviderId,
  });
}
