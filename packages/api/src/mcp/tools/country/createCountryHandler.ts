import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export const CreateCountrySchema = {
  country: z.object({
    isoCode: z
      .string()
      .min(2)
      .max(2)
      .toUpperCase()
      .describe('2-letter ISO 3166-1 alpha-2 country code (e.g., "CH", "US")'),
  }),
};

export const CreateCountryZodSchema = z.object(CreateCountrySchema);
export type CreateCountryParams = z.infer<typeof CreateCountryZodSchema>;

export async function createCountryHandler(context: Context, params: CreateCountryParams) {
  const { country } = params;
  const { modules, userId } = context;
  try {
    log(`handler createCountryHandler`, { userId, params });

    const countryId = await modules.countries.create(country as any);

    const newCountry = await modules.countries.findCountry({ countryId });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ country: newCountry }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error creating country: ${(error as Error).message}`,
        },
      ],
    };
  }
}
