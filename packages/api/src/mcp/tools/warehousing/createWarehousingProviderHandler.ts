import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { WarehousingDirector } from '@unchainedshop/core';
import { ProviderConfigurationInvalid } from '../../../errors.js';

const WarehousingProviderTypeEnum = z.enum(['PHYSICAL', 'VIRTUAL']);

export const CreateWarehousingProviderSchema = {
  warehousingProvider: z.object({
    type: WarehousingProviderTypeEnum.describe('Type of the warehousing provider'),
    adapterKey: z
      .string()
      .min(1)
      .describe(
        'Adapter key for the warehousing provider, it should be a valid interface key found in warehousing interfaces',
      ),
  }),
};

export const CreateWarehousingProviderZodSchema = z.object(CreateWarehousingProviderSchema);
export type CreateWarehousingProviderParams = z.infer<typeof CreateWarehousingProviderZodSchema>;

export async function createWarehousingProviderHandler(
  context: Context,
  params: CreateWarehousingProviderParams,
) {
  const { modules, userId } = context;
  const { warehousingProvider } = params;

  try {
    log('handler createWarehousingProviderHandler', { userId, warehousingProvider });

    const Adapter = WarehousingDirector.getAdapter(warehousingProvider.adapterKey);

    const provider = await modules.warehousing.create({
      configuration: Adapter.initialConfiguration,
      ...warehousingProvider,
    } as any);

    if (!provider) throw new ProviderConfigurationInvalid(warehousingProvider);

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
          text: `Error creating warehousing provider: ${(error as Error).message}`,
        },
      ],
    };
  }
}
