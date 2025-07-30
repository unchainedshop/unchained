import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

const DeliveryProviderTypeEnum = z
  .enum(['PICKUP', 'SHIPPING', 'LOCAL'])
  .describe('Delivery provider type');

export const DeliveryProvidersCountSchema = {
  type: DeliveryProviderTypeEnum.optional(),
};

export const DeliveryProvidersCountZodSchema = z.object(DeliveryProvidersCountSchema);
export type DeliveryProvidersCountParams = z.infer<typeof DeliveryProvidersCountZodSchema>;

export async function deliveryProvidersCountHandler(
  context: Context,
  params: DeliveryProvidersCountParams,
) {
  const { modules, userId } = context;
  const { type } = params;

  try {
    log('handler deliveryProvidersCountHandler', { userId, type });

    const count = await modules.delivery.count(params as any);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ count }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error counting delivery providers: ${(error as Error).message}`,
        },
      ],
    };
  }
}
