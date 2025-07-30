import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

const DeliveryProviderTypeEnum = z
  .enum(['PICKUP', 'SHIPPING', 'LOCAL'])
  .describe('Delivery provider type');

export const DeliveryProvidersListSchema = {
  type: DeliveryProviderTypeEnum.optional(),
};

export const DeliveryProvidersListZodSchema = z.object(DeliveryProvidersListSchema);
export type DeliveryProvidersListParams = z.infer<typeof DeliveryProvidersListZodSchema>;

export async function deliveryProvidersListHandler(
  context: Context,
  params: DeliveryProvidersListParams,
) {
  const { modules, userId } = context;
  const { type } = params;

  try {
    log('handler deliveryProvidersListHandler', { userId, type });

    const providers = await modules.delivery.findProviders(params as any);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ providers }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error fetching delivery providers: ${(error as Error).message}`,
        },
      ],
    };
  }
}
