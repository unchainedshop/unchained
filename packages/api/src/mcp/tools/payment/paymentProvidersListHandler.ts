import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

const PaymentProviderTypeEnum = z.enum(['CARD', 'INVOICE', 'GENERIC']);

export const PaymentProvidersListSchema = {
  type: PaymentProviderTypeEnum.optional().describe('Filter payment providers by type'),
};

export const PaymentProvidersListZodSchema = z.object(PaymentProvidersListSchema);
export type PaymentProvidersListParams = z.infer<typeof PaymentProvidersListZodSchema>;

export async function paymentProvidersListHandler(context: Context, params: PaymentProvidersListParams) {
  const { modules, userId } = context;

  try {
    log('handler paymentProvidersListHandler', { userId, params });

    const providers = await modules.payment.paymentProviders.findProviders(params as any);

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
