import { Context } from '../../context.js';
import { CountryNotFoundError, CurrencyNotFoundError, LanguageNotFoundError } from '../../errors.js';

export type LocalizationType = 'COUNTRY' | 'CURRENCY' | 'LANGUAGE';

export interface LocalizationModuleConfig {
  module: any;
  NotFoundError: any;
  entityName: string;
  idField: string;
  existsMethod: any;
  findMethod: any;
  findMultipleMethod: any;
}

export interface LocalizationEntity {
  isoCode: string;
  contractAddress?: string;
  decimals?: number;
}

export interface LocalizationUpdateEntity {
  isoCode?: string;
  contractAddress?: string;
  decimals?: number;
}

export interface LocalizationListOptions {
  limit?: number;
  offset?: number;
  includeInactive?: boolean;
  queryString?: string;
  sort?: {
    key: string;
    value: 'ASC' | 'DESC';
  }[];
}

export interface LocalizationCountOptions {
  includeInactive?: boolean;
  queryString?: string;
}

const validateIsoCode = (localizationType: LocalizationType, isoCode: string): string => {
  switch (localizationType) {
    case 'COUNTRY':
      if (isoCode.length !== 2) {
        throw new Error('Country ISO code must be exactly 2 characters (ISO 3166-1 alpha-2)');
      }
      return isoCode.toUpperCase();
    case 'CURRENCY':
      if (isoCode.length !== 3) {
        throw new Error('Currency ISO code must be exactly 3 characters (ISO 4217)');
      }
      return isoCode.toUpperCase();
    case 'LANGUAGE':
      if (isoCode.length < 2 || isoCode.length > 10) {
        throw new Error('Language ISO code must be 2-10 characters (ISO 639-1/ISO 3166-1)');
      }
      return isoCode;
    default:
      return isoCode;
  }
};

const sanitizeEntityData = (
  localizationType: LocalizationType,
  entity: LocalizationEntity | LocalizationUpdateEntity,
) => {
  const entityData = { ...entity };

  if (localizationType !== 'CURRENCY') {
    delete entityData.contractAddress;
    delete entityData.decimals;
  }

  if (entityData.isoCode) {
    entityData.isoCode = validateIsoCode(localizationType, entityData.isoCode);
  }

  return entityData;
};

export const getLocalizationConfig = (
  context: Context,
  localizationType: LocalizationType,
): LocalizationModuleConfig => {
  const { modules } = context;

  switch (localizationType) {
    case 'COUNTRY':
      return {
        module: modules.countries,
        NotFoundError: CountryNotFoundError,
        entityName: 'country',
        idField: 'countryId',
        existsMethod: modules.countries.countryExists,
        findMethod: modules.countries.findCountry,
        findMultipleMethod: modules.countries.findCountries,
      };
    case 'CURRENCY':
      return {
        module: modules.currencies,
        NotFoundError: CurrencyNotFoundError,
        entityName: 'currency',
        idField: 'currencyId',
        existsMethod: modules.currencies.currencyExists,
        findMethod: modules.currencies.findCurrency,
        findMultipleMethod: modules.currencies.findCurrencies,
      };
    case 'LANGUAGE':
      return {
        module: modules.languages,
        NotFoundError: LanguageNotFoundError,
        entityName: 'language',
        idField: 'languageId',
        existsMethod: modules.languages.languageExists,
        findMethod: modules.languages.findLanguage,
        findMultipleMethod: modules.languages.findLanguages,
      };
    default:
      throw new Error(`Unknown localization type: ${localizationType}`);
  }
};

export const configureLocalizationMcpModule = (context: Context) => {
  return {
    create: async (localizationType: LocalizationType, entity: LocalizationEntity) => {
      const config = getLocalizationConfig(context, localizationType);
      const entityData = sanitizeEntityData(localizationType, entity);

      const entityId = await config.module.create(entityData as any);
      const newEntity = await config.findMethod({ [config.idField]: entityId });

      return newEntity;
    },

    update: async (
      localizationType: LocalizationType,
      entityId: string,
      entity: LocalizationUpdateEntity,
    ) => {
      const config = getLocalizationConfig(context, localizationType);
      const existsParam = { [config.idField]: entityId };

      if (!(await config.existsMethod(existsParam))) {
        throw new config.NotFoundError(existsParam);
      }

      const updateData = sanitizeEntityData(localizationType, entity);
      await config.module.update(entityId, updateData);
      const updatedEntity = await config.findMethod(existsParam);

      return updatedEntity;
    },

    remove: async (localizationType: LocalizationType, entityId: string) => {
      const config = getLocalizationConfig(context, localizationType);
      const findParam = { [config.idField]: entityId };
      const existing = await config.findMethod(findParam);

      if (!existing) throw new config.NotFoundError(findParam);

      await config.module.delete(entityId);
      return existing;
    },

    get: async (localizationType: LocalizationType, entityId: string) => {
      const config = getLocalizationConfig(context, localizationType);
      const entity = await config.findMethod({ [config.idField]: entityId });

      return entity;
    },

    list: async (localizationType: LocalizationType, options: LocalizationListOptions = {}) => {
      const config = getLocalizationConfig(context, localizationType);
      const { limit = 50, offset = 0, includeInactive = false, queryString, sort } = options;

      const sortOptions = sort?.map((s) => ({ key: s.key, value: s.value as any })) || undefined;

      const entities = await config.findMultipleMethod({
        limit,
        offset,
        includeInactive,
        queryString,
        sort: sortOptions,
      });

      return entities;
    },

    count: async (localizationType: LocalizationType, options: LocalizationCountOptions = {}) => {
      const config = getLocalizationConfig(context, localizationType);
      const { includeInactive = false, queryString } = options;

      const count = await config.module.count({
        includeInactive,
        queryString,
      });

      return count;
    },

    getEntityName: (localizationType: LocalizationType) => {
      const config = getLocalizationConfig(context, localizationType);
      return config.entityName;
    },

    getPluralEntityName: (localizationType: LocalizationType) => {
      const config = getLocalizationConfig(context, localizationType);
      const mapper = {
        COUNTRY: 'countries',
        CURRENCY: 'currencies',
        LANGUAGE: 'languages',
      };
      return mapper[localizationType] || `${config.entityName}s`;
    },
  };
};

export type LocalizationMcpModule = ReturnType<typeof configureLocalizationMcpModule>;
