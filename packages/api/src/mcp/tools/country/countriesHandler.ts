import { z } from 'zod';
import { Context } from '../../../context.js';
import { SortDirection } from '@unchainedshop/utils';
import { log } from '@unchainedshop/logger';

const sortDirectionKeys = Object.keys(SortDirection) as [
  keyof typeof SortDirection,
  ...(keyof typeof SortDirection)[],
];

export const ListCountriesSchema = {
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(50)
    .describe('Maximum number of countries to return (pagination limit)'),
  offset: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe('Number of countries to skip before starting to collect the result set'),
  includeInactive: z
    .boolean()
    .default(false)
    .describe('Whether to include inactive (disabled) countries in the results'),
  queryString: z
    .string()
    .min(1)
    .optional()
    .describe('Optional case-insensitive text filter to search country name or code'),
  sort: z
    .array(
      z.object({
        key: z.string().min(1).describe('Field name to sort by (e.g., "name", "isoCode")'),
        value: z.enum(sortDirectionKeys).describe('Sorting direction, either "ASC" or "DESC"'),
      }),
    )
    .optional()
    .describe('List of fields and their corresponding sort directions'),
};

export const ListCountriesZodSchema = z.object(ListCountriesSchema);

export type ListCountriesParams = z.infer<typeof ListCountriesZodSchema>;

export async function countriesHandler(context: Context, params: ListCountriesParams) {
  const { limit, offset, includeInactive, queryString, sort } = params;
  const { modules, userId } = context;

  try {
    log(`handler countriesHandler`, {
      userId,
      params,
    });
    const countries = await modules.countries.findCountries({
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
          text: JSON.stringify({ countries }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error retrieving countries: ${(error as Error).message}`,
        },
      ],
    };
  }
}
