import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { WarehousingProviderNotFoundError } from '../../../errors.js';

export const RemoveWarehousingProviderSchema = {
  warehousingProviderId: z.string().min(1).describe('ID of the warehousing provider to soft delete'),
};

export const RemoveWarehousingProviderZodSchema = z.object(RemoveWarehousingProviderSchema);
export type RemoveWarehousingProviderParams = z.infer<typeof RemoveWarehousingProviderZodSchema>;
export async function removeWarehousingProviderHandler(
  context: Context,
  params: RemoveWarehousingProviderParams,
) {
  const { modules, userId } = context;
  const { warehousingProviderId } = params;

  try {
    log('handler removeWarehousingProviderHandler', { userId, warehousingProviderId });
    const provider = await modules.warehousing.findProvider({
      warehousingProviderId,
    });
    if (!provider) throw new WarehousingProviderNotFoundError({ warehousingProviderId });

    await modules.warehousing.delete(warehousingProviderId);

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
          text: `Error removing warehousing provider: ${(error as Error).message}`,
        },
      ],
    };
  }
}
