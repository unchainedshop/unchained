import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export const CurrenciesCountSchema = {
  includeInactive: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to include inactive currencies in the count'),
  queryString: z.string().optional().describe('Optional search string to filter currencies'),
};

export const CurrenciesCountZodSchema = z.object(CurrenciesCountSchema);

export type CurrenciesCountParams = z.infer<typeof CurrenciesCountZodSchema>;

export async function currenciesCountHandler(context: Context, params: CurrenciesCountParams) {
  const { modules, userId } = context;
  try {
    log(`handler currenciesCountHandler`, {
      userId,
      params,
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
