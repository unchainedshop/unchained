import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

const ProviderTypeEnum = z.enum(['PAYMENT', 'DELIVERY', 'WAREHOUSING'], {
  description:
    'Type of providers to list - PAYMENT (payment processors like Stripe, PayPal), DELIVERY (shipping services like FedEx, UPS), WAREHOUSING (inventory systems)',
});

const PaymentProviderTypeEnum = z.enum(['CARD', 'INVOICE', 'GENERIC']);
const DeliveryProviderTypeEnum = z.enum(['PICKUP', 'SHIPPING', 'LOCAL']);
const WarehousingProviderTypeEnum = z.enum(['PHYSICAL', 'VIRTUAL']);

export const ListProvidersSchema = {
  providerType: ProviderTypeEnum.describe('Type of provider system to list providers from'),
  typeFilter: z
    .union([PaymentProviderTypeEnum, DeliveryProviderTypeEnum, WarehousingProviderTypeEnum])
    .optional()
    .describe(
      'Optional filter by specific subtype: PAYMENT (CARD, INVOICE, GENERIC), DELIVERY (PICKUP, SHIPPING, LOCAL), WAREHOUSING (PHYSICAL, VIRTUAL)',
    ),
  queryString: z
    .string()
    .min(1)
    .optional()
    .describe(
      'Optional search term to filter providers by their ID or adapter key (case-insensitive partial match)',
    ),
};

export const ListProvidersZodSchema = z.object(ListProvidersSchema);
export type ListProvidersParams = z.infer<typeof ListProvidersZodSchema>;

export async function listProviders(context: Context, params: ListProvidersParams) {
  const { providerType, typeFilter, queryString } = params;
  const { modules, userId } = context;

  try {
    log('handler listProviders', { userId, providerType, typeFilter, queryString });

    let module: any;

    switch (providerType) {
      case 'PAYMENT':
        module = modules.payment.paymentProviders;
        break;
      case 'DELIVERY':
        module = modules.delivery;
        break;
      case 'WAREHOUSING':
        module = modules.warehousing;
        break;
      default:
        throw new Error(`Unknown provider type: ${providerType}`);
    }

    const selector: Record<string, any> = {};
    if (typeFilter) selector.type = typeFilter;

    if (queryString) {
      const regex = new RegExp(queryString, 'i');
      selector.$or = [{ _id: regex }, { adapterKey: regex }];
    }

    const providers = await module.findProviders(selector);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ providers }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error fetching ${providerType.toLowerCase()} providers: ${(error as Error).message}`,
        },
      ],
    };
  }
}
