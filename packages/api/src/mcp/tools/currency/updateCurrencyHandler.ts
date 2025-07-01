import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { CurrencyNotFoundError } from '../../../errors.js';

export const UpdateCurrencySchema = {
  currencyId: z.string().min(1).describe('ID of the currency to update'),
  currency: z.object({
    isoCode: z
      .string()
      .min(3)
      .max(3)
      .toUpperCase()
      .optional()
      .describe('3-letter ISO currency code, e.g., "USD" if not valid throw error'),
    contractAddress: z.string().optional().describe('Blockchain contract address'),
    decimals: z.number().int().nonnegative().optional().describe('Decimal precision'),
  }),
};

export const UpdateCurrencyZodSchema = z.object(UpdateCurrencySchema);
export type UpdateCurrencyParams = z.infer<typeof UpdateCurrencyZodSchema>;

export async function updateCurrencyHandler(context: Context, params: UpdateCurrencyParams) {
  const { currencyId, currency } = params;
  const { modules, userId } = context;

  try {
    log(`handler updateCurrency: ${currencyId}`, { userId });

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
