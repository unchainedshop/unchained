import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { PaymentDirector, DeliveryDirector, WarehousingDirector } from '@unchainedshop/core';

const ProviderTypeEnum = z.enum(['PAYMENT', 'DELIVERY', 'WAREHOUSING'], {
  description:
    'Type of provider to get available adapters for - PAYMENT (Stripe, PayPal, etc.), DELIVERY (FedEx, UPS, etc.), WAREHOUSING (inventory management systems)',
});

export const GetProviderInterfacesSchema = {
  providerType: ProviderTypeEnum.describe(
    'Type of provider system to retrieve available adapter interfaces for - shows all possible adapters that can be used when creating providers',
  ),
};

export const GetProviderInterfacesZodSchema = z.object(GetProviderInterfacesSchema);
export type GetProviderInterfacesParams = z.infer<typeof GetProviderInterfacesZodSchema>;

export async function getProviderInterfaces(context: Context, params: GetProviderInterfacesParams) {
  const { providerType } = params;
  const { userId } = context;

  try {
    log('handler getProviderInterfaces', { userId, providerType });

    let director: any;

    switch (providerType) {
      case 'PAYMENT':
        director = PaymentDirector;
        break;
      case 'DELIVERY':
        director = DeliveryDirector;
        break;
      case 'WAREHOUSING':
        director = WarehousingDirector;
        break;
      default:
        throw new Error(`Unknown provider type: ${providerType}`);
    }

    const interfaces = director.getAdapters().map((AdapterClass: any) => ({
      adapterKey: AdapterClass.key,
      label: AdapterClass.label,
      version: AdapterClass.version,
      isActivatedByDefault: AdapterClass.isActivatedByDefault,
      initialConfiguration: AdapterClass.initialConfiguration,
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
          text: `Error fetching ${providerType.toLowerCase()} provider interfaces: ${(error as Error).message}`,
        },
      ],
    };
  }
}
