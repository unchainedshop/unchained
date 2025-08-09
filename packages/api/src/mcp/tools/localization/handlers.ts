import { LocalizationType } from '../../modules/configureLocalizationMcpModule.js';
import { ActionName, Handler } from './schemas.js';

const actionHandlers: { [K in ActionName]: Handler<K> } = {
  CREATE: async (localizationModule, { localizationType, entity }) => {
    const newEntity = await localizationModule.create(
      localizationType as LocalizationType,
      entity as { isoCode: string; contractAddress?: string; decimals?: number },
    );
    const entityName = localizationModule.getEntityName(localizationType as LocalizationType);

    return { [entityName]: newEntity };
  },

  UPDATE: async (localizationModule, { localizationType, entityId, entity }) => {
    const updatedEntity = await localizationModule.update(
      localizationType as LocalizationType,
      entityId,
      entity,
    );
    const entityName = localizationModule.getEntityName(localizationType as LocalizationType);

    return { [entityName]: updatedEntity };
  },

  REMOVE: async (localizationModule, { localizationType, entityId }) => {
    const existing = await localizationModule.remove(localizationType as LocalizationType, entityId);
    const entityName = localizationModule.getEntityName(localizationType as LocalizationType);

    return { [entityName]: existing, localizationType };
  },

  GET: async (localizationModule, { localizationType, entityId }) => {
    const entity = await localizationModule.get(localizationType as LocalizationType, entityId);
    const entityName = localizationModule.getEntityName(localizationType as LocalizationType);

    if (!entity) {
      return { [entityName]: null, message: `${localizationType} not found for ID: ${entityId}` };
    }

    return { [entityName]: entity, localizationType };
  },

  LIST: async (
    localizationModule,
    { localizationType, limit, offset, includeInactive, queryString, sort },
  ) => {
    const sortOptions =
      sort?.filter((s): s is { key: string; value: 'ASC' | 'DESC' } => Boolean(s.key && s.value)) ||
      undefined;

    const entities = await localizationModule.list(localizationType as LocalizationType, {
      limit,
      offset,
      includeInactive,
      queryString,
      sort: sortOptions,
    });

    const pluralEntityName = localizationModule.getPluralEntityName(
      localizationType as LocalizationType,
    );

    return { [pluralEntityName]: entities, localizationType };
  },

  COUNT: async (localizationModule, { localizationType, includeInactive, queryString }) => {
    const count = await localizationModule.count(localizationType as LocalizationType, {
      includeInactive,
      queryString,
    });

    return { count, type: localizationType };
  },
};

export default actionHandlers;
