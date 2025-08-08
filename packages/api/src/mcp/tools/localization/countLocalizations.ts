import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

const LocalizationTypeEnum = z.enum(['COUNTRY', 'CURRENCY', 'LANGUAGE'], {
  description:
    'Type of localization entities - COUNTRY for country counting, CURRENCY for currency counting, LANGUAGE for language counting',
});

export const CountLocalizationsSchema = {
  localizationType: LocalizationTypeEnum.describe('Type of localization entities to count'),
  includeInactive: z
    .boolean()
    .default(false)
    .describe('Whether to include inactive (disabled) entities in the count'),
  queryString: z
    .string()
    .min(1)
    .optional()
    .describe('Optional case-insensitive text filter to search entity name or ISO code when counting'),
};

export const CountLocalizationsZodSchema = z.object(CountLocalizationsSchema);
export type CountLocalizationsParams = z.infer<typeof CountLocalizationsZodSchema>;

export async function countLocalizations(context: Context, params: CountLocalizationsParams) {
  const { localizationType, includeInactive, queryString } = params;
  const { modules, userId } = context;

  try {
    log('handler countLocalizations', { userId, localizationType, params });

    let module: any;
    let entityName: string;

    if (localizationType === 'COUNTRY') {
      module = modules.countries;
      entityName = 'countries';
    } else if (localizationType === 'CURRENCY') {
      module = modules.currencies;
      entityName = 'currencies';
    } else if (localizationType === 'LANGUAGE') {
      module = modules.languages;
      entityName = 'languages';
    }

    const count = await module.count({
      includeInactive,
      queryString,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ count, type: localizationType }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error counting ${localizationType}s: ${(error as Error).message}`,
        },
      ],
    };
  }
}
