import { z } from 'zod';
import { Context } from '../../../context.js';
import { CountryNotFoundError } from '../../../errors.js';
import { log } from '@unchainedshop/logger';

export const CountrySchema = {
  countryId: z.string().min(1).describe('ID of the country to retrieve'),
};

export const CountryZodSchema = z.object(CountrySchema);

export type CountryParams = z.infer<typeof CountryZodSchema>;

export async function countryHandler(context: Context, params: CountryParams) {
  const { countryId } = params;
  const { modules, userId } = context;

  try {
    log(`handler countryHandler`, {
      userId,
      params,
    });
    const country = await modules.countries.findCountry({ countryId });

    if (!country) throw new CountryNotFoundError({ countryId });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ country }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error retrieving country: ${(error as Error).message}`,
        },
      ],
    };
  }
}
