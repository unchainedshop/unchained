import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { CountryNotFoundError, CurrencyNotFoundError, LanguageNotFoundError } from '../../../errors.js';

const LocalizationTypeEnum = z.enum(['COUNTRY', 'CURRENCY', 'LANGUAGE'], {
  description:
    'Type of localization entity - COUNTRY for country removal, CURRENCY for currency removal, LANGUAGE for language removal',
});

export const RemoveLocalizationSchema = {
  localizationType: LocalizationTypeEnum.describe('Type of localization entity to remove'),
  entityId: z.string().min(1).describe('Unique identifier of the entity to soft delete'),
};

export const RemoveLocalizationZodSchema = z.object(RemoveLocalizationSchema);
export type RemoveLocalizationParams = z.infer<typeof RemoveLocalizationZodSchema>;

export async function removeLocalization(context: Context, params: RemoveLocalizationParams) {
  const { localizationType, entityId } = params;
  const { modules, userId } = context;

  try {
    log('handler removeLocalization', { userId, localizationType, entityId });

    let module: any;
    let NotFoundError: any;
    let entityName: string;
    let idField: string;

    let findMethod;

    if (localizationType === 'COUNTRY') {
      module = modules.countries;
      NotFoundError = CountryNotFoundError;
      entityName = 'country';
      idField = 'countryId';
      findMethod = modules.countries.findCountry;
    } else if (localizationType === 'CURRENCY') {
      module = modules.currencies;
      NotFoundError = CurrencyNotFoundError;
      entityName = 'currency';
      idField = 'currencyId';
      findMethod = modules.currencies.findCurrency;
    } else if (localizationType === 'LANGUAGE') {
      module = modules.languages;
      NotFoundError = LanguageNotFoundError;
      entityName = 'language';
      idField = 'languageId';
      findMethod = modules.languages.findLanguage;
    }

    const findParam = { [idField]: entityId };
    const existing = await findMethod(findParam);

    if (!existing) throw new NotFoundError(findParam);

    await module.delete(entityId);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ [entityName]: existing, localizationType }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error removing ${localizationType}: ${(error as Error).message}`,
        },
      ],
    };
  }
}
