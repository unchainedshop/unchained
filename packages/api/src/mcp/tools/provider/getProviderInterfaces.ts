import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { PaymentDirector, DeliveryDirector, WarehousingDirector } from '@unchainedshop/core';

const ProviderTypeEnum = z.enum(['PAYMENT', 'DELIVERY', 'WAREHOUSING'], {
  description:
    'Type of provider to get available adapters for - PAYMENT (Stripe, PayPal, etc.), DELIVERY (FedEx, UPS, etc.), WAREHOUSING (inventory management systems)',
});

const PaymentProviderTypeEnum = z.enum(['CARD', 'INVOICE', 'GENERIC']);
const DeliveryProviderTypeEnum = z.enum(['PICKUP', 'SHIPPING', 'LOCAL']);
const WarehousingProviderTypeEnum = z.enum(['PHYSICAL', 'VIRTUAL']);

export const GetProviderInterfacesSchema = {
  providerType: ProviderTypeEnum.describe(
    'Type of provider system to retrieve available adapter interfaces for - shows all possible adapters that can be used when creating providers',
  ),
  typeFilter: z
    .union([PaymentProviderTypeEnum, DeliveryProviderTypeEnum, WarehousingProviderTypeEnum])
    .optional()
    .describe(
      'Optional filter by specific provider subtype: PAYMENT (CARD, INVOICE, GENERIC), DELIVERY (PICKUP, SHIPPING, LOCAL), WAREHOUSING (PHYSICAL, VIRTUAL) - only shows adapters compatible with this subtype',
    ),
};

export const GetProviderInterfacesZodSchema = z.object(GetProviderInterfacesSchema);
export type GetProviderInterfacesParams = z.infer<typeof GetProviderInterfacesZodSchema>;

export async function getProviderInterfaces(context: Context, params: GetProviderInterfacesParams) {
  const { providerType, typeFilter } = params;
  const { userId } = context;

  try {
    log('handler getProviderInterfaces', { userId, providerType, typeFilter });

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

    let allAdapters = director.getAdapters();

    if (typeFilter) {
      allAdapters = allAdapters.filter((adapter: any) => adapter.typeSupported(typeFilter));
    }

    const interfaces = allAdapters.map((Adapter: any) => ({
      adapterKey: Adapter.key,
      label: Adapter.label,
      version: Adapter.version,
    }));

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            interfaces,
            providerType,
            typeFilter: typeFilter || null,
          }),
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
