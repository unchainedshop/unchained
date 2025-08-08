import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import {
  PaymentProviderNotFoundError,
  DeliverProviderNotFoundError,
  WarehousingProviderNotFoundError,
} from '../../../errors.js';

const ProviderTypeEnum = z.enum(['PAYMENT', 'DELIVERY', 'WAREHOUSING'], {
  description: 'Type of provider to remove - determines which module to use for the operation',
});

export const RemoveProviderSchema = {
  providerType: ProviderTypeEnum.describe('Type of provider to remove'),
  providerId: z.string().min(1).describe('ID of the provider to soft delete'),
};

export const RemoveProviderZodSchema = z.object(RemoveProviderSchema);
export type RemoveProviderParams = z.infer<typeof RemoveProviderZodSchema>;

export async function removeProvider(context: Context, params: RemoveProviderParams) {
  const { providerType, providerId } = params;
  const { modules, userId } = context;

  try {
    log('handler removeProvider', { userId, providerType, providerId });

    let module: any;
    let NotFoundError: any;
    let idField: string;

    switch (providerType) {
      case 'PAYMENT':
        module = modules.payment.paymentProviders;
        NotFoundError = PaymentProviderNotFoundError;
        idField = 'paymentProviderId';
        break;
      case 'DELIVERY':
        module = modules.delivery;
        NotFoundError = DeliverProviderNotFoundError;
        idField = 'deliveryProviderId';
        break;
      case 'WAREHOUSING':
        module = modules.warehousing;
        NotFoundError = WarehousingProviderNotFoundError;
        idField = 'warehousingProviderId';
        break;
      default:
        throw new Error(`Unknown provider type: ${providerType}`);
    }

    const existing = await module.findProvider({ [idField]: providerId });
    if (!existing) throw new NotFoundError({ [idField]: providerId });

    await module.delete(providerId);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ provider: existing }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error removing ${providerType.toLowerCase()} provider: ${(error as Error).message}`,
        },
      ],
    };
  }
}
