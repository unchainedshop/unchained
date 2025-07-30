import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { WarehousingDirector } from '@unchainedshop/core';
import { WarehousingProviderType } from '@unchainedshop/core-warehousing';

const WarehousingProviderTypeEnum = z
  .enum(['PHYSICAL', 'VIRTUAL'])
  .describe('Warehousing provider type');

export const WarehousingInterfacesSchema = {
  type: WarehousingProviderTypeEnum.describe('Type of warehousing provider interface'),
};

export const WarehousingInterfacesZodSchema = z.object(WarehousingInterfacesSchema);
export type WarehousingInterfacesParams = z.infer<typeof WarehousingInterfacesZodSchema>;

export async function warehousingInterfacesHandler(
  context: Context,
  params: WarehousingInterfacesParams,
) {
  const { userId } = context;
  const { type } = params;

  try {
    log('handler warehousingInterfacesHandler', { userId, type });

    const interfaces = await WarehousingDirector.getAdapters({
      adapterFilter: (Adapter) => Adapter.typeSupported(type as WarehousingProviderType),
    }).map((Adapter) => ({
      _id: Adapter.key,
      label: Adapter.label,
      version: Adapter.version,
    }));

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ interfaces }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error fetching warehousing interfaces: ${(error as Error).message}`,
        },
      ],
    };
  }
}
