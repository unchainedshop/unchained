import { z } from 'zod';
import { Context } from '../../../context.js';
import { SortDirection } from '@unchainedshop/utils';
import { log } from '@unchainedshop/logger';

const sortDirectionKeys = Object.keys(SortDirection) as [
  keyof typeof SortDirection,
  ...(keyof typeof SortDirection)[],
];

export const ListCurrenciesSchema = {
  limit: z.number().int().min(1).max(100).default(50).describe('Maximum number of currencies to return'),
  offset: z.number().int().min(0).default(0).describe('Number of currencies to skip (for pagination)'),
  includeInactive: z
    .boolean()
    .default(false)
    .describe('Whether to include inactive currencies in the results'),
  queryString: z.string().min(1).optional().describe('Optional text search to filter currencies'),
  sort: z
    .array(
      z.object({
        key: z.string().min(1).describe('Field to sort by'),
        value: z.enum(sortDirectionKeys).describe("Sort direction, either 'ASC' or 'DESC'"),
      }),
    )
    .optional()
    .describe('Sorting configuration'),
};

export const ListCurrenciesZodSchema = z.object(ListCurrenciesSchema);

export type ListCurrenciesParams = z.infer<typeof ListCurrenciesZodSchema>;

export async function currenciesHandler(context: Context, params: ListCurrenciesParams) {
  const { limit, offset, includeInactive, queryString, sort } = params;

  const { modules, userId } = context;

  try {
    log(`handler currenciesHandler`, {
      userId,
      params,
    });
    const currencies = await modules.currencies.findCurrencies({
      limit,
      offset,
      includeInactive,
      queryString,
      sort: sort as any[],
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            currencies,
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error retrieving currencies: ${(error as Error).message}`,
        },
      ],
    };
  }
}
