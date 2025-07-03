import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { CurrencyNotFoundError } from '../../../errors.js';

export const RemoveCurrencySchema = {
  currencyId: z.string().min(1).describe('ID of the currency to remove'),
};

export const RemoveCurrencyZodSchema = z.object(RemoveCurrencySchema);

export type RemoveCurrencyParams = z.infer<typeof RemoveCurrencyZodSchema>;

export async function removeCurrencyHandler(context: Context, params: RemoveCurrencyParams) {
  const { currencyId } = params;
  const { modules, userId } = context;

  try {
    log(`handler removeCurrencyHandler`, { userId, params });

    if (!(await modules.currencies.currencyExists({ currencyId })))
      throw new CurrencyNotFoundError({ currencyId });

    await modules.currencies.delete(currencyId);

    const removedCurrency = await modules.currencies.findCurrency({ currencyId });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ currency: removedCurrency }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error removing currency: ${(error as Error).message}`,
        },
      ],
    };
  }
}
