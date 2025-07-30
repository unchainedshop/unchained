import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { PaymentProviderNotFoundError } from '../../../errors.js';

export const RemovePaymentProviderSchema = {
  paymentProviderId: z.string().min(1).describe('ID of the payment provider to soft delete'),
};

export const RemovePaymentProviderZodSchema = z.object(RemovePaymentProviderSchema);
export type RemovePaymentProviderParams = z.infer<typeof RemovePaymentProviderZodSchema>;

export async function removePaymentProviderHandler(
  context: Context,
  params: RemovePaymentProviderParams,
) {
  const { modules, userId } = context;
  const { paymentProviderId } = params;

  try {
    log('handler removePaymentProviderHandler', { userId, paymentProviderId });

    const provider = await modules.payment.paymentProviders.findProvider({
      paymentProviderId,
    });
    if (!provider) throw new PaymentProviderNotFoundError({ paymentProviderId });

    await modules.payment.paymentProviders.delete(paymentProviderId);

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
          text: `Error removing payment provider: ${(error as Error).message}`,
        },
      ],
    };
  }
}
