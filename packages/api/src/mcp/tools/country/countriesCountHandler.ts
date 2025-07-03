import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export const CountriesCountSchema = {
  includeInactive: z
    .boolean()
    .optional()
    .default(false)
    .describe('If true, include inactive countries in the count. Defaults to false.'),
  queryString: z
    .string()
    .optional()
    .describe('Optional search string to filter countries by name or code'),
};

export const CountriesCountZodSchema = z.object(CountriesCountSchema);

export type CountriesCountParams = z.infer<typeof CountriesCountZodSchema>;

export async function countriesCountHandler(context: Context, params: CountriesCountParams) {
  const { modules, userId } = context;

  try {
    log(`handler countriesCountHandler`, {
      userId,
      params,
    });

    const count = await modules.countries.count(params);

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
          text: `Error counting countries: ${(error as Error).message}`,
        },
      ],
    };
  }
}
