import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

const WarehousingProviderTypeEnum = z
  .enum(['PHYSICAL', 'VIRTUAL'])
  .describe('Warehousing provider type');

export const WarehousingProvidersListSchema = {
  type: WarehousingProviderTypeEnum.optional().describe('Optional filter by provider type'),
  queryString: z.string().min(1).optional().describe('Search by _id or adapterKey (partial match)'),
};

export const WarehousingProvidersListZodSchema = z.object(WarehousingProvidersListSchema);
export type WarehousingProvidersListParams = z.infer<typeof WarehousingProvidersListZodSchema>;

export async function warehousingProvidersListHandler(
  context: Context,
  params: WarehousingProvidersListParams,
) {
  const { modules, userId } = context;
  const { type, queryString } = params;

  try {
    log('handler warehousingProvidersListHandler', { userId, type, queryString });

    const selector: Record<string, any> = {};
    if (type) selector.type = type;

    if (queryString) {
      const regex = new RegExp(queryString, 'i');
      selector.$or = [{ _id: regex }, { adapterKey: regex }];
    }

    const providers = await modules.warehousing.findProviders(selector);

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
          text: `Error fetching warehousing providers: ${(error as Error).message}`,
        },
      ],
    };
  }
}
