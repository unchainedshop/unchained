import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

const LocalizationTypeEnum = z.enum(['COUNTRY', 'CURRENCY', 'LANGUAGE'], {
  description:
    'Type of localization entity - COUNTRY for country retrieval, CURRENCY for currency retrieval, LANGUAGE for language retrieval',
});

export const GetLocalizationSchema = {
  localizationType: LocalizationTypeEnum.describe('Type of localization entity to retrieve'),
  entityId: z.string().min(1).describe('Unique identifier of the entity to retrieve'),
};

export const GetLocalizationZodSchema = z.object(GetLocalizationSchema);
export type GetLocalizationParams = z.infer<typeof GetLocalizationZodSchema>;

export async function getLocalization(context: Context, params: GetLocalizationParams) {
  const { localizationType, entityId } = params;
  const { modules, userId } = context;

  try {
    log('handler getLocalization', { userId, localizationType, entityId });

    let module: any;
    let entityName: string;
    let idField: string;

    if (localizationType === 'COUNTRY') {
      module = modules.countries;
      entityName = 'country';
      idField = 'countryId';
    } else if (localizationType === 'CURRENCY') {
      module = modules.currencies;
      entityName = 'currency';
      idField = 'currencyId';
    } else if (localizationType === 'LANGUAGE') {
      module = modules.languages;
      entityName = 'language';
      idField = 'languageId';
    }

    const findMethod = `find${entityName.charAt(0).toUpperCase() + entityName.slice(1)}`;
    const entity = await module[findMethod]({ [idField]: entityId });

    if (!entity) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `${localizationType} not found for ID: ${entityId}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ [entityName]: entity, localizationType }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error fetching ${localizationType}: ${(error as Error).message}`,
        },
      ],
    };
  }
}
