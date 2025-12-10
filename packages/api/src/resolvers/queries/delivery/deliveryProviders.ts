import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';

export default async function deliveryProviders(
  root: never,
  params: {
    type?: DeliveryProviderType | null;
  },
  { modules, userId }: Context,
) {
  log(`query deliveryProviders ${params.type}`, { userId });

  return modules.delivery.findProviders(
    params.type
      ? {
          type: params.type,
        }
      : {},
  );
}
