import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { PaymentDirector } from '@unchainedshop/core';
import { PaymentProviderType } from '@unchainedshop/core-payment';

const PaymentProviderTypeEnum = z.enum(['CARD', 'INVOICE', 'GENERIC']);

export const PaymentInterfacesSchema = {
  type: PaymentProviderTypeEnum.optional().describe('Optional filter by payment provider type'),
};

export const PaymentInterfacesZodSchema = z.object(PaymentInterfacesSchema);
export type PaymentInterfacesParams = z.infer<typeof PaymentInterfacesZodSchema>;

export async function paymentInterfacesHandler(context: Context, params: PaymentInterfacesParams) {
  const { userId } = context;
  const { type } = params;

  try {
    log('handler paymentInterfacesHandler', { userId, type });

    const allAdapters = await PaymentDirector.getAdapters();

    const filteredAdapters = type
      ? allAdapters.filter((Adapter) => Adapter.typeSupported(type as PaymentProviderType))
      : allAdapters;

    const interfaces = filteredAdapters.map((Adapter) => ({
      _id: Adapter.key,
      label: Adapter.label,
      version: Adapter.version,
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
          text: `Error fetching payment interfaces: ${(error as Error).message}`,
        },
      ],
    };
  }
}
