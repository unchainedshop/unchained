import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { DeliveryProvider } from '@unchainedshop/types/delivery';
import { DeliveryProviderType } from '@unchainedshop/types/delivery';
import { InvalidIdError } from '../../../errors';

export default async function deliveryProvider(
  root: Root,
  { deliveryProviderId }: { deliveryProviderId: string },
  { modules, userId }: Context
) {
  log(`query deliveryProvider ${deliveryProviderId}`, { userId });

  if (!deliveryProviderId) throw new InvalidIdError({ deliveryProviderId });

  return await modules.delivery.findProvider({ deliveryProviderId });
}
