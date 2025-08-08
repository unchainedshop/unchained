import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { PaymentDirector, DeliveryDirector, WarehousingDirector } from '@unchainedshop/core';
import { ProviderConfigurationInvalid } from '../../../errors.js';

const ProviderTypeEnum = z.enum(['PAYMENT', 'DELIVERY', 'WAREHOUSING'], {
  description:
    'Type of provider to create - PAYMENT for payment processing (cards, invoices), DELIVERY for shipping/pickup methods, WAREHOUSING for inventory management',
});

const PaymentProviderTypeEnum = z.enum(['CARD', 'INVOICE', 'GENERIC']);
const DeliveryProviderTypeEnum = z.enum(['PICKUP', 'SHIPPING', 'LOCAL']);
const WarehousingProviderTypeEnum = z.enum(['PHYSICAL', 'VIRTUAL']);

export const CreateProviderSchema = {
  providerType: ProviderTypeEnum.describe('Type of provider system to create a provider for'),
  provider: z
    .object({
      type: z
        .union([PaymentProviderTypeEnum, DeliveryProviderTypeEnum, WarehousingProviderTypeEnum])
        .describe(
          'Specific provider subtype: PAYMENT types (CARD, INVOICE, GENERIC), DELIVERY types (PICKUP, SHIPPING, LOCAL), WAREHOUSING types (PHYSICAL, VIRTUAL) - must match providerType category',
        ),
      adapterKey: z
        .string()
        .min(1)
        .describe(
          'Unique adapter key that identifies the specific provider implementation - get available keys from provider_interfaces tool',
        ),
    })
    .describe('Provider configuration including type and adapter'),
};

export const CreateProviderZodSchema = z.object(CreateProviderSchema);
export type CreateProviderParams = z.infer<typeof CreateProviderZodSchema>;

export async function createProvider(context: Context, params: CreateProviderParams) {
  const { providerType, provider } = params;
  const { modules, userId } = context;

  try {
    log('handler createProvider', { userId, providerType, provider });

    let module: any;
    let director: any;
    let created: any;

    switch (providerType) {
      case 'PAYMENT':
        module = modules.payment.paymentProviders;
        director = PaymentDirector;
        break;
      case 'DELIVERY':
        module = modules.delivery;
        director = DeliveryDirector;
        break;
      case 'WAREHOUSING':
        module = modules.warehousing;
        director = WarehousingDirector;
        break;
      default:
        throw new Error(`Unknown provider type: ${providerType}`);
    }

    const Adapter = director.getAdapter(provider.adapterKey);
    if (!Adapter) throw new ProviderConfigurationInvalid(provider);

    created = await module.create({
      configuration: Adapter.initialConfiguration,
      ...provider,
    } as any);

    if (!created) throw new ProviderConfigurationInvalid(provider);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ provider: created }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error creating ${providerType.toLowerCase()} provider: ${(error as Error).message}`,
        },
      ],
    };
  }
}
