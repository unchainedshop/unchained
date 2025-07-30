import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { DeliverProviderNotFoundError } from '../../../errors.js';

export const UpdateDeliveryProviderSchema = {
    deliveryProviderId: z.string().min(1).describe('ID of the delivery provider to update'),
    deliveryProvider: z.object({
        configuration: z.array(z.any()).optional().describe('Array of JSON configuration values, with a structure {key, value}'),
    }),
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
