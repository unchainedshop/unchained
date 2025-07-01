import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export const CurrenciesCountSchema = {
  includeInactive: z
    .boolean()
    .optional()
    .default(false)
    .describe('Include inactive currencies in count'),
  queryString: z.string().optional().describe('Optional search filter'),
};

export const CurrenciesCountZodSchema = z.object(CurrenciesCountSchema);

export type CurrenciesCountParams = z.infer<typeof CurrenciesCountZodSchema>;

export async function currenciesCountHandler(context: Context, params: CurrenciesCountParams) {
  const { includeInactive = false, queryString } = params;
  const { modules, userId } = context;

  try {
    log(`Handler currenciesCount (includeInactive: ${includeInactive}, query: ${queryString ?? ''})`, {
      userId,
    });

    const count = await modules.currencies.count(params);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(count),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error counting currencies: ${(error as Error).message}`,
        },
      ],
    };
  }
}
