import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

const PaymentProviderTypeEnum = z.enum(['CARD', 'INVOICE', 'GENERIC']);

export const PaymentProvidersListSchema = {
  type: PaymentProviderTypeEnum.optional().describe('Optional filter by payment provider type'),
  queryString: z.string().min(1).optional().describe('Optional full-text search string'),
};

export const PaymentProvidersListZodSchema = z.object(PaymentProvidersListSchema);
export type PaymentProvidersListParams = z.infer<typeof PaymentProvidersListZodSchema>;
export async function paymentProvidersListHandler(context: Context, params: PaymentProvidersListParams) {
  const { modules, userId } = context;

  try {
    log('handler paymentProvidersListHandler', { userId, params });

    const { type, queryString } = params;

    const selector: Record<string, any> = {};
    if (type) selector.type = type;

    if (queryString) {
      const regex = new RegExp(queryString, 'i');
      selector.$or = [{ _id: regex }, { adapterKey: regex }];
    }

    const providers = await modules.payment.paymentProviders.findProviders(selector);

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
          text: `Error fetching payment providers: ${(error as Error).message}`,
        },
      ],
    };
  }
}
