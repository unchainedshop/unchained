import { z } from 'zod';

import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { DeliveryDirector } from '@unchainedshop/core';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';

const DeliveryProviderTypeEnum = z
  .enum(['PICKUP', 'SHIPPING', 'LOCAL'])
  .describe('Delivery provider type');

export const DeliveryInterfacesSchema = {
  type: DeliveryProviderTypeEnum.optional().describe('Optional filter by delivery provider type'),
};

export const DeliveryInterfacesZodSchema = z.object(DeliveryInterfacesSchema);
export type DeliveryInterfacesParams = z.infer<typeof DeliveryInterfacesZodSchema>;

export async function deliveryInterfacesHandler(context: Context, params: DeliveryInterfacesParams) {
  const { userId } = context;
  const { type } = params;

  try {
    log('handler deliveryInterfacesHandler', { userId, type });

    const allAdapters = await DeliveryDirector.getAdapters();

    const filteredAdapters = type
      ? allAdapters.filter((Adapter) => Adapter.typeSupported(type as DeliveryProviderType))
      : allAdapters;

    const interfaces = filteredAdapters.map((Adapter) => ({
      _id: Adapter.key,
      label: Adapter.label,
      version: Adapter.version,
    }));

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ interfaces }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error fetching delivery interfaces: ${(error as Error).message}`,
        },
      ],
    };
  }
}
