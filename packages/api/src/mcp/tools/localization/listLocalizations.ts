import { z } from 'zod';
import { Context } from '../../../context.js';
import { SortDirection } from '@unchainedshop/utils';
import { log } from '@unchainedshop/logger';

const LocalizationTypeEnum = z.enum(['COUNTRY', 'CURRENCY', 'LANGUAGE'], {
  description:
    'Type of localization entities to retrieve - COUNTRY for geographic regions, CURRENCY for monetary systems, LANGUAGE for locale configurations',
});

const sortDirectionKeys = Object.keys(SortDirection) as [
  keyof typeof SortDirection,
  ...(keyof typeof SortDirection)[],
];

export const ListLocalizationsSchema = {
  localizationType: LocalizationTypeEnum.describe('Which localization system to query for entities'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(50)
    .describe('Maximum number of results per page for pagination (1-100, defaults to 50)'),
  offset: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe('Number of records to skip for pagination - use (pageNumber - 1) * limit'),
  includeInactive: z
    .boolean()
    .default(false)
    .describe(
      'Include disabled/inactive entities in results - set to true to see all entities regardless of status',
    ),
  queryString: z
    .string()
    .min(1)
    .optional()
    .describe(
      'Search filter for entity names or ISO codes (case-insensitive partial match) - e.g., "United" matches "United States", "US" matches country code',
    ),
  sort: z
    .array(
      z.object({
        key: z
          .string()
          .min(1)
          .describe('Database field name for sorting (common: "isoCode", "name", "created", "updated")'),
        value: z
          .enum(sortDirectionKeys)
          .describe('Sort direction: "ASC" for ascending (A-Z, 0-9), "DESC" for descending (Z-A, 9-0)'),
      }),
    )
    .optional()
    .describe('Custom sorting rules - if not provided, uses default system ordering'),
};

export const ListLocalizationsZodSchema = z.object(ListLocalizationsSchema);
export type ListLocalizationsParams = z.infer<typeof ListLocalizationsZodSchema>;

export async function listLocalizations(context: Context, params: ListLocalizationsParams) {
  const { localizationType, limit, offset, includeInactive, queryString, sort } = params;
  const { modules, userId } = context;

  try {
    log('handler listLocalizations', { userId, localizationType, params });

    let entityName: string;
    let findMethod;
    if (localizationType === 'COUNTRY') {
      entityName = 'countries';
      findMethod = modules.countries.findCountries;
    } else if (localizationType === 'CURRENCY') {
      entityName = 'currencies';
      findMethod = modules.currencies.findCurrencies;
    } else if (localizationType === 'LANGUAGE') {
      entityName = 'languages';
      findMethod = modules.languages.findLanguages;
    }

    const entities = await findMethod({
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
          text: JSON.stringify({ [entityName]: entities, localizationType }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error fetching ${localizationType.toLowerCase()} list: ${(error as Error).message}`,
        },
      ],
    };
  }
}
