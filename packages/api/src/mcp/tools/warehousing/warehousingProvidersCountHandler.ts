import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

const WarehousingProviderTypeEnum = z
  .enum(['PHYSICAL', 'VIRTUAL'])
  .describe('Warehousing provider type');

export const WarehousingProvidersCountSchema = {
  type: WarehousingProviderTypeEnum.optional(),
};

export const WarehousingProvidersCountZodSchema = z.object(WarehousingProvidersCountSchema);
export type WarehousingProvidersCountParams = z.infer<typeof WarehousingProvidersCountZodSchema>;

export async function warehousingProvidersCountHandler(
  context: Context,
  params: WarehousingProvidersCountParams,
) {
  const { modules, userId } = context;
  const { type } = params;

  try {
    log('handler warehousingProvidersCountHandler', { userId, type });

    const count = await modules.warehousing.count(params as any);

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
          text: `Error counting warehousing providers: ${(error as Error).message}`,
        },
      ],
    };
  }
}
