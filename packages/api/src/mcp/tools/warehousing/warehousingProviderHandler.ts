import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export const WarehousingProviderByIdSchema = {
  warehousingProviderId: z.string().min(1).describe('ID of the warehousing provider'),
};

export const WarehousingProviderByIdZodSchema = z.object(WarehousingProviderByIdSchema);
export type WarehousingProviderByIdParams = z.infer<typeof WarehousingProviderByIdZodSchema>;

export async function warehousingProviderHandler(
  context: Context,
  params: WarehousingProviderByIdParams,
) {
  const { modules, userId } = context;
  const { warehousingProviderId } = params;

  try {
    log('handler warehousingProviderHandler', { userId, warehousingProviderId });

    const provider = await modules.warehousing.findProvider({
      warehousingProviderId,
    });

    if (!provider) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Warehousing provider not found for ID: ${warehousingProviderId}`,
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
          text: `Error fetching warehousing provider: ${(error as Error).message}`,
        },
      ],
    };
  }
}
