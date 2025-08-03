import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

const DeliveryProviderTypeEnum = z
  .enum(['PICKUP', 'SHIPPING', 'LOCAL'])
  .describe('Delivery provider type');

export const DeliveryProvidersListSchema = {
  type: DeliveryProviderTypeEnum.optional().describe('Optional filter by delivery provider type'),
  queryString: z.string().min(1).optional().describe('Search by _id or adapterKey (partial match)'),
};

export const DeliveryProvidersListZodSchema = z.object(DeliveryProvidersListSchema);
export type DeliveryProvidersListParams = z.infer<typeof DeliveryProvidersListZodSchema>;
export async function deliveryProvidersListHandler(
  context: Context,
  params: DeliveryProvidersListParams,
) {
  const { modules, userId } = context;
  const { type, queryString } = params;

  try {
    log('handler deliveryProvidersListHandler', { userId, type, queryString });

    const selector: Record<string, any> = {};
    if (type) selector.type = type;

    if (queryString) {
      const regex = new RegExp(queryString, 'i');
      selector.$or = [{ _id: regex }, { adapterKey: regex }];
    }

    const providers = await modules.delivery.findProviders(selector);

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
