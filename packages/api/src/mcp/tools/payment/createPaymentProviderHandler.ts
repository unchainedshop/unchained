import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { PaymentDirector } from '@unchainedshop/core';
import { ProviderConfigurationInvalid } from '../../../errors.js';

const PaymentProviderTypeEnum = z.enum(['CARD', 'INVOICE', 'GENERIC']);

export const CreatePaymentProviderSchema = {
  paymentProvider: z.object({
    type: PaymentProviderTypeEnum.describe('Type of payment provider'),
    adapterKey: z
      .string()
      .min(1)
      .describe(
        'Adapter key for the payment provider, this value should be a valid adapter key found in payment provider interfaces',
      ),
  }),
};

export const CreatePaymentProviderZodSchema = z.object(CreatePaymentProviderSchema);
export type CreatePaymentProviderParams = z.infer<typeof CreatePaymentProviderZodSchema>;

export async function createPaymentProviderHandler(
  context: Context,
  params: CreatePaymentProviderParams,
) {
  const { modules, userId } = context;
  const { paymentProvider } = params;

  try {
    log('handler createPaymentProviderHandler', { userId, paymentProvider });

    const Adapter = PaymentDirector.getAdapter(paymentProvider.adapterKey);
    if (!Adapter) throw new ProviderConfigurationInvalid(paymentProvider);

    const created = await modules.payment.paymentProviders.create({
      configuration: Adapter.initialConfiguration,
      ...paymentProvider,
    } as any);

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
          text: `Error creating payment provider: ${(error as Error).message}`,
        },
      ],
    };
  }
}
