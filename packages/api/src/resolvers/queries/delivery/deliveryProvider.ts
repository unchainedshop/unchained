import { Context } from '../../../types.js';
import { log } from '@unchainedshop/logger';
import { InvalidIdError } from '../../../errors.js';

export default async function deliveryProvider(
  root: never,
  { deliveryProviderId }: { deliveryProviderId: string },
  { modules, userId }: Context,
) {
  log(`query deliveryProvider ${deliveryProviderId}`, { userId });

  if (!deliveryProviderId) throw new InvalidIdError({ deliveryProviderId });

  return modules.delivery.findProvider({ deliveryProviderId });
}
