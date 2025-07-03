import { z } from 'zod';
import { Context } from '../../../context.js';
import { CurrencyNotFoundError } from '../../../errors.js';
import { log } from '@unchainedshop/logger';

export const CurrencySchema = {
  currencyId: z.string().min(1).describe('The unique ID of the currency to retrieve'),
};

export const CurrencyZodSchema = z.object(CurrencySchema);

export type CurrencyParams = z.infer<typeof CurrencyZodSchema>;

export async function currencyHandler(context: Context, params: CurrencyParams) {
  const { currencyId } = params;
  const { modules, userId } = context;

  try {
    log(`handler currencyHandler`, {
      userId,
      params,
    });
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
