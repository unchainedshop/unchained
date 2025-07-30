import { z } from 'zod';

export const DeliveryProviderByIdSchema = {
  deliveryProviderId: z.string().min(1).describe('ID of the delivery provider'),
};

export const DeliveryProviderByIdZodSchema = z.object(DeliveryProviderByIdSchema);
export type DeliveryProviderByIdParams = z.infer<typeof DeliveryProviderByIdZodSchema>;

import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export async function deliveryProviderHandler(context: Context, params: DeliveryProviderByIdParams) {
  const { modules, userId } = context;
  const { deliveryProviderId } = params;

  try {
    log('handler deliveryProviderByIdHandler', { userId, deliveryProviderId });

    const provider = await modules.delivery.findProvider({ deliveryProviderId });

    if (!provider) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Delivery provider not found for ID: ${deliveryProviderId}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ provider }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error fetching delivery provider: ${(error as Error).message}`,
        },
      ],
    };
  }
}
