import { Context, Root } from '@unchainedshop/types/api';
import { log } from 'meteor/unchained:logger';
import { InvalidIdError } from '../../../errors';

export default async function deliveryProvider(
  root: Root,
  { deliveryProviderId }: { deliveryProviderId: string },
  { modules, userId }: Context
) {
  log(`query deliveryProvider ${deliveryProviderId}`, { userId });

  if (!deliveryProviderId) throw new InvalidIdError({ deliveryProviderId });

  return modules.delivery.findProvider({ deliveryProviderId });
}
