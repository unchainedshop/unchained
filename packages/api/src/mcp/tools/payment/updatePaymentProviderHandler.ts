import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { PaymentProviderNotFoundError } from '../../../errors.js';

const ConfigurationEntry = z.object({
  key: z.string().min(1).describe('Configuration key'),
  value: z.any().describe('Configuration value'),
});

export const UpdatePaymentProviderSchema = {
  paymentProviderId: z.string().min(1).describe('ID of the payment provider to update'),
  paymentProvider: z
    .object({
      configuration: z
        .array(ConfigurationEntry)
        .optional()
        .describe('List of key-value configuration entries'),
    })
    .refine(
      (data) => {
        const keys = data.configuration?.map((entry) => entry.key) || [];
        return new Set(keys).size === keys.length;
      },
      {
        message: 'Duplicate keys are not allowed in configuration.',
        path: ['configuration'],
      },
    ),
};

export const UpdatePaymentProviderZodSchema = z.object(UpdatePaymentProviderSchema);
export type UpdatePaymentProviderParams = z.infer<typeof UpdatePaymentProviderZodSchema>;

export async function updatePaymentProviderHandler(
  context: Context,
  params: UpdatePaymentProviderParams,
) {
  const { modules, userId } = context;
  const { paymentProviderId, paymentProvider } = params;

  try {
    log('handler updatePaymentProviderHandler', { userId, paymentProviderId, paymentProvider });

    if (
      !(await modules.payment.paymentProviders.providerExists({
        paymentProviderId,
      }))
    )
      throw new PaymentProviderNotFoundError({ paymentProviderId });

    const updated = await modules.payment.paymentProviders.update(
      paymentProviderId,
      paymentProvider as any,
    );

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ provider: updated }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error updating payment provider: ${(error as Error).message}`,
        },
      ],
    };
  }
}
