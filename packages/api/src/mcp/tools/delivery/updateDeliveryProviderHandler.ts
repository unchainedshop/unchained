import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { DeliverProviderNotFoundError } from '../../../errors.js';

const ConfigurationEntry = z.object({
  key: z.string().min(1).describe('Configuration key'),
  value: z.any().describe('Configuration value'),
});

export const UpdateDeliveryProviderSchema = {
  deliveryProviderId: z.string().min(1).describe('ID of the delivery provider to update'),
  deliveryProvider: z
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

export const UpdateDeliveryProviderZodSchema = z.object(UpdateDeliveryProviderSchema);
export type UpdateDeliveryProviderParams = z.infer<typeof UpdateDeliveryProviderZodSchema>;

export async function updateDeliveryProviderHandler(
  context: Context,
  params: UpdateDeliveryProviderParams,
) {
  const { modules, userId } = context;
  const { deliveryProviderId, deliveryProvider } = params;

  try {
    log('handler updateDeliveryProviderHandler', { userId, deliveryProviderId, deliveryProvider });

    if (!(await modules.delivery.providerExists({ deliveryProviderId })))
      throw new DeliverProviderNotFoundError({ deliveryProviderId });

    const updated = await modules.delivery.update(deliveryProviderId, deliveryProvider as any);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ provider: updated }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error updating delivery provider: ${(error as Error).message}`,
        },
      ],
    };
  }
}
