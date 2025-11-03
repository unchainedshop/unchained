import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';

export default async function deliveryProvidersCount(
  root: never,
  params: {
    type?: DeliveryProviderType | null;
  },
  { modules, userId }: Context,
) {
  log(`query deliveryProvidersCount ${params.type}`, { userId });

  return modules.delivery.count(
    params.type
      ? {
          type: params.type,
        }
      : {},
  );
}
