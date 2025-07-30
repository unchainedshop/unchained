import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { WarehousingProviderNotFoundError } from '../../../errors.js';

const ConfigurationEntry = z.object({
  key: z.string().min(1).describe('Configuration key'),
  value: z.any().describe('Configuration value'),
});

export const UpdateWarehousingProviderSchema = {
  warehousingProviderId: z.string().min(1).describe('ID of the warehousing provider to update'),
  warehousingProvider: z
    .object({
      configuration: z
        .array(ConfigurationEntry)
        .optional()
        .describe('List of key-value configuration entries'),
    })
    .refine(
      (data) => {
        const keys = data.configuration?.map((entry) => entry.key) || [];
        return new Set(keys).size === keys.length;
      },
      {
        message: 'Duplicate keys are not allowed in configuration.',
        path: ['configuration'],
      },
    ),
};

export const UpdateWarehousingProviderZodSchema = z.object(UpdateWarehousingProviderSchema);
export type UpdateWarehousingProviderParams = z.infer<typeof UpdateWarehousingProviderZodSchema>;

export async function updateWarehousingProviderHandler(
  context: Context,
  params: UpdateWarehousingProviderParams,
) {
  const { modules, userId } = context;
  const { warehousingProviderId, warehousingProvider } = params;

  try {
    log('handler updateWarehousingProviderHandler', {
      userId,
      warehousingProviderId,
      warehousingProvider,
    });

    if (!(await modules.warehousing.providerExists({ warehousingProviderId })))
      throw new WarehousingProviderNotFoundError({ warehousingProviderId });

    const provider = await modules.warehousing.update(warehousingProviderId, warehousingProvider as any);

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
          text: `Error updating warehousing provider: ${(error as Error).message}`,
        },
      ],
    };
  }
}
