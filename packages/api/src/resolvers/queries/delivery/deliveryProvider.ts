import { Context, Root } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';
import { InvalidIdError } from '../../../errors.js';

export default async function deliveryProvider(
  root: Root,
  { deliveryProviderId }: { deliveryProviderId: string },
  { modules, userId }: Context,
) {
  log(`query deliveryProvider ${deliveryProviderId}`, { userId });

  if (!deliveryProviderId) throw new InvalidIdError({ deliveryProviderId });

  return modules.delivery.findProvider({ deliveryProviderId });
}
