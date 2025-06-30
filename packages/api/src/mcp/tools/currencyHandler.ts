import { z } from 'zod';
import { Context } from '../../context.js';
import { CurrencyNotFoundError } from '../../errors.js';

export const CurrencySchema = {
  currencyId: z.string().min(1).describe('The ID of the currency to fetch'),
};

export const CurrencyZodSchema = z.object(CurrencySchema);

export type CurrencyParams = z.infer<typeof CurrencyZodSchema>;

export async function currencyHandler(context: Context, params: CurrencyParams) {
  const { currencyId } = params;
  const { modules } = context;

  try {
    const currency = await modules.currencies.findCurrency({ currencyId });

    if (!currency) throw new CurrencyNotFoundError({ currencyId });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ currency }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error retrieving currency: ${(error as Error).message}`,
        },
      ],
    };
  }
}
