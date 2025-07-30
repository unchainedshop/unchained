import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { DeliveryDirector } from '@unchainedshop/core';
import { ProviderConfigurationInvalid } from '../../../errors.js';

const DeliveryProviderTypeEnum = z.enum(['PICKUP', 'SHIPPING', 'LOCAL']);

export const CreateDeliveryProviderSchema = {
  deliveryProvider: z.object({
    type: DeliveryProviderTypeEnum.describe('Type of delivery provider'),
    adapterKey: z
      .string()
      .min(1)
      .describe(
        'Adapter key for the delivery provider, this value should be valid interface found in delivery provider interfaces',
      ),
  }),
};

export const CreateDeliveryProviderZodSchema = z.object(CreateDeliveryProviderSchema);
export type CreateDeliveryProviderParams = z.infer<typeof CreateDeliveryProviderZodSchema>;

export async function createDeliveryProviderHandler(
  context: Context,
  params: CreateDeliveryProviderParams,
) {
  const { modules, userId } = context;
  const { deliveryProvider } = params;

  try {
    log('handler createDeliveryProviderHandler', { userId, deliveryProvider });

    const Adapter = DeliveryDirector.getAdapter(deliveryProvider.adapterKey);
    if (!Adapter) return null;

    const provider = await modules.delivery.create({
      configuration: Adapter.initialConfiguration,
      ...deliveryProvider,
    } as any);

    if (!provider) throw new ProviderConfigurationInvalid(deliveryProvider);

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
          text: `Error creating delivery provider: ${(error as Error).message}`,
        },
      ],
    };
  }
}
