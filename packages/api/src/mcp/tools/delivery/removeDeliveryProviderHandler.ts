import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { DeliverProviderNotFoundError } from '../../../errors.js';

export const RemoveDeliveryProviderSchema = {
  deliveryProviderId: z.string().min(1).describe('ID of the delivery provider to soft delete'),
};

export const RemoveDeliveryProviderZodSchema = z.object(RemoveDeliveryProviderSchema);
export type RemoveDeliveryProviderParams = z.infer<typeof RemoveDeliveryProviderZodSchema>;

export async function removeDeliveryProviderHandler(
  context: Context,
  params: RemoveDeliveryProviderParams,
) {
  const { modules, userId } = context;
  const { deliveryProviderId } = params;
  try {
    log('handler removeDeliveryProviderHandler', { userId, deliveryProviderId });

    const provider = await modules.delivery.findProvider({ deliveryProviderId });
    if (!provider) throw new DeliverProviderNotFoundError({ deliveryProviderId });

    const removed = await modules.delivery.delete(deliveryProviderId);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ provider: removed }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error removing delivery provider: ${(error as Error).message}`,
        },
      ],
    };
  }
}
