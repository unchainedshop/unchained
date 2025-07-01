import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { CountryNotFoundError } from '../../../errors.js';

export const RemoveCountrySchema = {
  countryId: z.string().min(1).describe('ID of the country to remove'),
};

export const RemoveCountryZodSchema = z.object(RemoveCountrySchema);

export type RemoveCountryParams = z.infer<typeof RemoveCountryZodSchema>;

export async function removeCountryHandler(context: Context, params: RemoveCountryParams) {
  const { countryId } = params;
  const { modules, userId } = context;

  try {
    log(`handler removeCountry: ${countryId}`, { userId });

    if (!(await modules.countries.countryExists({ countryId })))
      throw new CountryNotFoundError({ countryId });

    await modules.countries.delete(countryId);

    const removedCountry = await modules.countries.findCountry({ countryId });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ country: removedCountry }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error removing country: ${(error as Error).message}`,
        },
      ],
    };
  }
}
