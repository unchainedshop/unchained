import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { CountryNotFoundError, CurrencyNotFoundError, LanguageNotFoundError } from '../../../errors.js';

const LocalizationTypeEnum = z.enum(['COUNTRY', 'CURRENCY', 'LANGUAGE'], {
  description:
    'Type of localization entity to modify - COUNTRY for updating country settings, CURRENCY for updating currency configurations, LANGUAGE for updating language options',
});

export const UpdateLocalizationSchema = {
  localizationType: LocalizationTypeEnum.describe(
    'Which localization system contains the entity to update',
  ),
  entityId: z
    .string()
    .min(1)
    .describe(
      'Database ID of the specific entity instance to modify - use localization_list to find available IDs',
    ),
  entity: z
    .object({
      isoCode: z
        .string()
        .min(1)
        .optional()
        .describe(
          'Updated ISO identifier following format rules: Countries=2 chars (US→CA), Currencies=3 chars (USD→EUR), Languages=2-10 chars (en→de-CH)',
        ),
      contractAddress: z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid 42-character blockchain address starting with 0x')
        .optional()
        .describe(
          'Updated blockchain contract address for tokenized currencies - only processed for CURRENCY type, ignored for COUNTRY/LANGUAGE',
        ),
      decimals: z
        .number()
        .int()
        .nonnegative()
        .optional()
        .describe(
          'Updated decimal precision for financial calculations - only processed for CURRENCY type (0-18 typical range), ignored for COUNTRY/LANGUAGE',
        ),
    })
    .describe(
      'Entity update data - provide only the fields you want to change, others remain unchanged',
    ),
};

export const UpdateLocalizationZodSchema = z.object(UpdateLocalizationSchema);
export type UpdateLocalizationParams = z.infer<typeof UpdateLocalizationZodSchema>;

export async function updateLocalization(context: Context, params: UpdateLocalizationParams) {
  const { localizationType, entityId, entity } = params;
  const { modules, userId } = context;

  try {
    log('handler updateLocalization', { userId, localizationType, entityId, entity });

    let module: any;
    let NotFoundError: any;
    let entityName: string;
    let idField: string;
    let existsMethod;
    let findMethod;
    if (localizationType === 'COUNTRY') {
      module = modules.countries;
      NotFoundError = CountryNotFoundError;
      entityName = 'country';
      idField = 'countryId';

      if (entity.isoCode && entity.isoCode.length !== 2) {
        throw new Error('Country ISO code must be exactly 2 characters (ISO 3166-1 alpha-2)');
      }
      if (entity.isoCode) entity.isoCode = entity.isoCode.toUpperCase();
      existsMethod = modules.countries.countryExists;
      findMethod = modules.countries.findCountry;
    } else if (localizationType === 'CURRENCY') {
      module = modules.currencies;
      NotFoundError = CurrencyNotFoundError;
      entityName = 'currency';
      idField = 'currencyId';

      if (entity.isoCode && entity.isoCode.length !== 3) {
        throw new Error('Currency ISO code must be exactly 3 characters (ISO 4217)');
      }
      if (entity.isoCode) entity.isoCode = entity.isoCode.toUpperCase();
      existsMethod = modules.currencies.currencyExists;
      findMethod = modules.currencies.findCurrency;
    } else if (localizationType === 'LANGUAGE') {
      module = modules.languages;
      NotFoundError = LanguageNotFoundError;
      entityName = 'language';
      idField = 'languageId';

      if (entity.isoCode && (entity.isoCode.length < 2 || entity.isoCode.length > 10)) {
        throw new Error('Language ISO code must be 2-10 characters (ISO 639-1/ISO 3166-1)');
      }
      existsMethod = modules.languages.languageExists;
      findMethod = modules.languages.findLanguage;
    }

    const existsParam = { [idField]: entityId };

    if (!(await existsMethod(existsParam))) {
      throw new NotFoundError(existsParam);
    }

    const updateData = { ...entity };
    if (localizationType !== 'CURRENCY') {
      delete updateData.contractAddress;
      delete updateData.decimals;
    }

    await module.update(entityId, updateData);
    const updatedEntity = await findMethod(existsParam);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ [entityName]: updatedEntity }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error updating ${localizationType}: ${(error as Error).message}`,
        },
      ],
    };
  }
}
