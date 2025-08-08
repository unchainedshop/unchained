import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import {
  DeliverProviderNotFoundError,
  PaymentProviderNotFoundError,
  WarehousingProviderNotFoundError,
} from '../../../errors.js';

const ProviderTypeEnum = z.enum(['PAYMENT', 'DELIVERY', 'WAREHOUSING'], {
  description:
    'Type of provider to update - PAYMENT for payment processors, DELIVERY for shipping services, WAREHOUSING for inventory systems',
});

const ConfigurationEntry = z.object({
  key: z
    .string()
    .min(1)
    .describe('Configuration parameter name (e.g., "apiKey", "webhookUrl", "sandbox")'),
  value: z
    .any()
    .describe(
      'Configuration parameter value (string, number, boolean, or object depending on the setting)',
    ),
});

export const UpdateProviderSchema = {
  providerType: ProviderTypeEnum.describe('Type of provider system containing the provider to update'),
  providerId: z
    .string()
    .min(1)
    .describe('Unique identifier of the specific provider instance to update'),
  configuration: z
    .array(ConfigurationEntry)
    .min(1)
    .describe(
      'Array of configuration key-value pairs to update - each provider adapter has different required/optional configuration parameters',
    )
    .refine(
      (data) => {
        const keys = data.map((entry) => entry.key);
        return new Set(keys).size === keys.length;
      },
      {
        message: 'Duplicate configuration keys are not allowed - each key must be unique.',
        path: ['configuration'],
      },
    ),
};

export const UpdateProviderZodSchema = z.object(UpdateProviderSchema);
export type UpdateProviderParams = z.infer<typeof UpdateProviderZodSchema>;

export async function updateProvider(context: Context, params: UpdateProviderParams) {
  const { providerType, providerId, configuration } = params;
  const { modules, userId } = context;

  try {
    log('handler updateProvider', { userId, providerType, providerId, configuration });

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

    // Check if provider exists
    const existsParam = { [idField]: providerId };

    if (providerType === 'PAYMENT') {
      if (!(await module.providerExists(existsParam))) {
        throw new NotFoundError(existsParam);
      }
    } else {
      const existing = await module.findProvider(existsParam);
      if (!existing) throw new NotFoundError(existsParam);
    }

    const updated = await module.update(providerId, { configuration } as any);

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
          text: `Error updating ${providerType.toLowerCase()} provider: ${(error as Error).message}`,
        },
      ],
    };
  }
}
