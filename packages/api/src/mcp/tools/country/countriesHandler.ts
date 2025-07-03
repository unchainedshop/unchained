import { z } from 'zod';
import { Context } from '../../../context.js';
import { SortDirection } from '@unchainedshop/utils';

const sortDirectionKeys = Object.keys(SortDirection) as [
  keyof typeof SortDirection,
  ...(keyof typeof SortDirection)[],
];

export const ListCountriesSchema = {
  limit: z.number().int().min(1).max(100).default(50).describe('Maximum number of countries to return'),
  offset: z.number().int().min(0).default(0).describe('Number of countries to skip (for pagination)'),
  includeInactive: z.boolean().default(false).describe('Whether to include inactive countries'),
  queryString: z.string().min(1).optional().describe('Optional text-based filter'),
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

export const ListCountriesZodSchema = z.object(ListCountriesSchema);

export type ListCountriesParams = z.infer<typeof ListCountriesZodSchema>;

export async function countriesHandler(context: Context, params: ListCountriesParams) {
  const { limit, offset, includeInactive, queryString, sort } = params;
  const { modules } = context;

  try {
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
