import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

const ProviderTypeEnum = z.enum(['PAYMENT', 'DELIVERY', 'WAREHOUSING'], {
  description: 'Type of provider to retrieve - determines which module to use for the operation',
});

export const GetProviderSchema = {
  providerType: ProviderTypeEnum.describe('Type of provider to retrieve'),
  providerId: z.string().min(1).describe('ID of the provider to retrieve'),
};

export const GetProviderZodSchema = z.object(GetProviderSchema);
export type GetProviderParams = z.infer<typeof GetProviderZodSchema>;

export async function getProvider(context: Context, params: GetProviderParams) {
  const { providerType, providerId } = params;
  const { modules, userId } = context;

  try {
    log('handler getProvider', { userId, providerType, providerId });

    let module: any;
    let idField: string;

    switch (providerType) {
      case 'PAYMENT':
        module = modules.payment.paymentProviders;
        idField = 'paymentProviderId';
        break;
      case 'DELIVERY':
        module = modules.delivery;
        idField = 'deliveryProviderId';
        break;
      case 'WAREHOUSING':
        module = modules.warehousing;
        idField = 'warehousingProviderId';
        break;
      default:
        throw new Error(`Unknown provider type: ${providerType}`);
    }

    const provider = await module.findProvider({ [idField]: providerId });

    if (!provider) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `${providerType.toLowerCase()} provider not found for ID: ${providerId}`,
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
          text: `Error fetching ${providerType.toLowerCase()} provider: ${(error as Error).message}`,
        },
      ],
    };
  }
}
