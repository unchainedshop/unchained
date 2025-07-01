import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { CountryNotFoundError } from '../../../errors.js';

export const UpdateCountrySchema = {
  countryId: z.string().min(1).describe('ID of the country to update'),
  country: z.object({
    isoCode: z
      .string()
      .min(2)
      .max(2)
      .toUpperCase()
      .describe('2-letter ISO 3166-1 alpha-2 country code (e.g., "CH", "US")'),
    isActive: z.boolean().optional().describe('Whether the country is active'),
    defaultCurrencyCode: z
      .string()
      .min(3)
      .max(3)
      .toUpperCase()
      .optional()
      .describe('Default currency code (e.g., "USD", "CHF")'),
  }),
};

export const UpdateCountryZodSchema = z.object(UpdateCountrySchema);
export type UpdateCountryParams = z.infer<typeof UpdateCountryZodSchema>;

export async function updateCountryHandler(context: Context, params: UpdateCountryParams) {
  const { country, countryId } = params;
  const { modules, userId } = context;
  try {
    log(`handler updateCountry: ${countryId}`, { userId });

    if (!(await modules.countries.countryExists({ countryId })))
      throw new CountryNotFoundError({ countryId });

    await modules.countries.update(countryId, country as any);

    const updatedCountry = await modules.countries.findCountry({ countryId });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ country: updatedCountry }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error updating country: ${(error as Error).message}`,
        },
      ],
    };
  }
}
