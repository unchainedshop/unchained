import { z } from 'zod';
import { Context } from '../../../context.js';
import { SortDirection } from '@unchainedshop/utils';

const sortDirectionKeys = Object.keys(SortDirection) as [
  keyof typeof SortDirection,
  ...(keyof typeof SortDirection)[],
];

export const ListCountriesSchema = {
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  includeInactive: z.boolean().default(false),
  queryString: z.string().min(1).optional(),
  sort: z
    .array(
      z.object({
        key: z.string().min(1),
        value: z.enum(sortDirectionKeys).describe("Sort direction, e.g., 'ASC' or 'DESC'"),
      }),
    )
    .optional(),
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
