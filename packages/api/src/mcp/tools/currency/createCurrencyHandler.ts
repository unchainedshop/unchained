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
      .describe('3-letter ISO currency code (e.g., "USD", "EUR", "CHF")'),
    contractAddress: z.string().optional().describe('Blockchain contract address (optional)'),
    decimals: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('Decimal precision for the currency (optional)'),
  }),
};

export const CreateCurrencyZodSchema = z.object(CreateCurrencySchema);
export type CreateCurrencyParams = z.infer<typeof CreateCurrencyZodSchema>;

export async function createCurrencyHandler(context: Context, params: CreateCurrencyParams) {
  const { currency } = params;
  const { modules, userId } = context;

  try {
    log(`Handler createCurrency: ${currency.isoCode}`, { userId });

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
