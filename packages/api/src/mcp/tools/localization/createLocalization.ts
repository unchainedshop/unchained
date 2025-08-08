import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

const LocalizationTypeEnum = z.enum(['COUNTRY', 'CURRENCY', 'LANGUAGE'], {
  description:
    'Type of localization entity to create - COUNTRY for geographic regions (US, DE, CH), CURRENCY for monetary units (USD, EUR, CHF), LANGUAGE for locale support (en, de, fr)',
});

export const CreateLocalizationSchema = {
  localizationType: LocalizationTypeEnum.describe(
    'Which type of localization system to create an entity for',
  ),
  entity: z
    .object({
      isoCode: z
        .string()
        .min(1)
        .describe(
          'Standard ISO identifier: Countries need 2-letter codes (US, DE), Currencies need 3-letter codes (USD, EUR), Languages accept 2-10 characters (en, de-CH)',
        ),
      contractAddress: z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid 42-character blockchain address starting with 0x')
        .optional()
        .describe(
          'Blockchain contract address for tokenized currencies - only used when localizationType is CURRENCY, ignored otherwise',
        ),
      decimals: z
        .number()
        .int()
        .nonnegative()
        .optional()
        .describe(
          'Decimal precision for currency calculations - only used when localizationType is CURRENCY (2 for traditional currencies like USD, 18 for crypto tokens), ignored otherwise',
        ),
    })
    .describe('Localization entity configuration data'),
};

export const CreateLocalizationZodSchema = z.object(CreateLocalizationSchema);
export type CreateLocalizationParams = z.infer<typeof CreateLocalizationZodSchema>;

export async function createLocalization(context: Context, params: CreateLocalizationParams) {
  const { localizationType, entity } = params;
  const { modules, userId } = context;

  try {
    log('handler createLocalization', { userId, localizationType, entity });

    let module: any;
    let newEntity: any;
    let entityName: string;

    if (localizationType === 'COUNTRY') {
      if (entity.isoCode.length !== 2) {
        throw new Error('Country ISO code must be exactly 2 characters (ISO 3166-1 alpha-2)');
      }
      entity.isoCode = entity.isoCode.toUpperCase();
      module = modules.countries;
      entityName = 'country';
    } else if (localizationType === 'CURRENCY') {
      if (entity.isoCode.length !== 3) {
        throw new Error('Currency ISO code must be exactly 3 characters (ISO 4217)');
      }
      entity.isoCode = entity.isoCode.toUpperCase();
      module = modules.currencies;
      entityName = 'currency';
    } else if (localizationType === 'LANGUAGE') {
      if (entity.isoCode.length < 2 || entity.isoCode.length > 10) {
        throw new Error('Language ISO code must be 2-10 characters (ISO 639-1/ISO 3166-1)');
      }
      module = modules.languages;
      entityName = 'language';
    }

    // Remove currency-specific fields for non-currency entities
    const entityData = { ...entity };
    if (localizationType !== 'CURRENCY') {
      delete entityData.contractAddress;
      delete entityData.decimals;
    }

    const entityId = await module.create(entityData as any);

    if (localizationType === 'COUNTRY') {
      newEntity = await module.findCountry({ countryId: entityId });
    } else if (localizationType === 'CURRENCY') {
      newEntity = await module.findCurrency({ currencyId: entityId });
    } else {
      newEntity = await module.findLanguage({ languageId: entityId });
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ [entityName]: newEntity, localizationType }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error creating ${localizationType.toLowerCase()}: ${(error as Error).message}`,
        },
      ],
    };
  }
}
