import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export const CreateCurrencySchema = {
  currency: z.object({
    isoCode: z
      .string()
      .min(3)
      .max(3)
      .toUpperCase()
      .describe('3-letter ISO 4217 currency code (e.g., "USD", "EUR", "CHF")'),
    contractAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid 42-character blockchain address')
      .optional()
      .describe('Optional blockchain contract address for the currency'),
    decimals: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('Optional decimal precision used by the currency (e.g., 2 for USD, 18 for ETH)'),
  }),
};

export const CreateCurrencyZodSchema = z.object(CreateCurrencySchema);
export type CreateCurrencyParams = z.infer<typeof CreateCurrencyZodSchema>;

export async function createCurrencyHandler(context: Context, params: CreateCurrencyParams) {
  const { currency } = params;
  const { modules, userId } = context;

  try {
    log(`Handler createCurrencyHandler`, { userId, params });

    const currencyId = await modules.currencies.create(currency as any);

    const newCurrency = await modules.currencies.findCurrency({ currencyId });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ currency: newCurrency }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error creating currency: ${(error as Error).message}`,
        },
      ],
    };
  }
}
