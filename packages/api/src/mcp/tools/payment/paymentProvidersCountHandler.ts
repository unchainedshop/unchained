import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

const PaymentProviderTypeEnum = z.enum(['CARD', 'INVOICE', 'GENERIC']);

export const PaymentProvidersCountSchema = {
  type: PaymentProviderTypeEnum.optional().describe('Filter payment providers by type'),
};

export const PaymentProvidersCountZodSchema = z.object(PaymentProvidersCountSchema);
export type PaymentProvidersCountParams = z.infer<typeof PaymentProvidersCountZodSchema>;

export async function paymentProvidersCountHandler(
  context: Context,
  params: PaymentProvidersCountParams,
) {
  const { modules, userId } = context;

  try {
    log('handler paymentProvidersCountHandler', { userId, params });

    const count = await modules.payment.paymentProviders.count(params as any);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ count }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error counting payment providers: ${(error as Error).message}`,
        },
      ],
    };
  }
}
