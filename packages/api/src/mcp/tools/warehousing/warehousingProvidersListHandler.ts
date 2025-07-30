import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

const WarehousingProviderTypeEnum = z
  .enum(['PHYSICAL', 'VIRTUAL'])
  .describe('Warehousing provider type');

export const WarehousingProvidersListSchema = {
  type: WarehousingProviderTypeEnum.optional(),
};

export const WarehousingProvidersListZodSchema = z.object(WarehousingProvidersListSchema);
export type WarehousingProvidersListParams = z.infer<typeof WarehousingProvidersListZodSchema>;

export async function warehousingProvidersListHandler(
  context: Context,
  params: WarehousingProvidersListParams,
) {
  const { modules, userId } = context;
  const { type } = params;

  try {
    log('handler warehousingProvidersListHandler', { userId, type });

    const providers = await modules.warehousing.findProviders(params as any);
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
