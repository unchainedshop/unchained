import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export const PaymentProviderByIdSchema = {
  paymentProviderId: z.string().min(1).describe('ID of the payment provider'),
};

export const PaymentProviderByIdZodSchema = z.object(PaymentProviderByIdSchema);
export type PaymentProviderByIdParams = z.infer<typeof PaymentProviderByIdZodSchema>;

export async function paymentProviderByIdHandler(context: Context, params: PaymentProviderByIdParams) {
  const { modules, userId } = context;
  const { paymentProviderId } = params;

  try {
    log('handler paymentProviderByIdHandler', { userId, paymentProviderId });

    const provider = await modules.payment.paymentProviders.findProvider({
      paymentProviderId,
    });

    if (!provider) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Payment provider not found for ID: ${paymentProviderId}`,
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
          text: `Error fetching payment provider: ${(error as Error).message}`,
        },
      ],
    };
  }
}
