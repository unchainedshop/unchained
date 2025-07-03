import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { CurrencyNotFoundError } from '../../../errors.js';

export const UpdateCurrencySchema = {
  currencyId: z.string().min(1).describe('The unique ID of the currency to update'),
  currency: z.object({
    isoCode: z
      .string()
      .min(3, 'ISO code must be exactly 3 letters')
      .max(3, 'ISO code must be exactly 3 letters')
      .regex(/^[A-Z]{3}$/, 'ISO code must be uppercase 3-letter code')
      .optional()
      .describe('3-letter ISO currency code, e.g., "USD". Must be valid uppercase.'),
    contractAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid 42-character blockchain address')
      .optional()
      .describe('Blockchain contract address (if applicable)'),
    decimals: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('Decimal precision (e.g., 2 for cents, 18 for tokens)'),
  }),
};

export const UpdateCurrencyZodSchema = z.object(UpdateCurrencySchema);
export type UpdateCurrencyParams = z.infer<typeof UpdateCurrencyZodSchema>;

export async function updateCurrencyHandler(context: Context, params: UpdateCurrencyParams) {
  const { currencyId, currency } = params;
  const { modules, userId } = context;

  try {
    log(`handler updateCurrencyHandler`, { userId, params });

    if (!(await modules.currencies.currencyExists({ currencyId })))
      throw new CurrencyNotFoundError({ currencyId });

    await modules.currencies.update(currencyId, currency);

    const updatedCurrency = await modules.currencies.findCurrency({ currencyId });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ currency: updatedCurrency }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error updating currency: ${(error as Error).message}`,
        },
      ],
    };
  }
}
