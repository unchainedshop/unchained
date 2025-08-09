import { FilterType } from '../../modules/configureFilterMcpModule.js';
import { ActionName, Handler } from './schemas.js';

const actionHandlers: { [K in ActionName]: Handler<K> } = {
  CREATE: async (filterModule, { filter, texts }) => {
    const created = await filterModule.create(
      filter as { key: string; type: FilterType; options?: string[] },
      texts,
    );

    return { filter: created };
  },

  UPDATE: async (filterModule, { filterId, updateData }) => {
    const updated = await filterModule.update(filterId, updateData);
    return { filter: updated };
  },

  REMOVE: async (filterModule, { filterId }) => {
    const removed = await filterModule.remove(filterId);
    return { filter: removed };
  },

  GET: async (filterModule, { filterId }) => {
    const filter = await filterModule.get(filterId);
    return { filter };
  },

  LIST: async (filterModule, { limit, offset, sort, includeInactive, queryString }) => {
    const sortOptions =
      sort?.filter((s): s is { key: string; value: 'ASC' | 'DESC' } => Boolean(s.key && s.value)) ||
      undefined;

    const filters = await filterModule.list({
      limit,
      offset,
      sort: sortOptions,
      includeInactive,
      queryString,
    });

    return { filters };
  },

  COUNT: async (filterModule, { includeInactive, queryString }) => {
    const count = await filterModule.count({
      includeInactive,
      queryString,
    });

    return { count };
  },

  CREATE_OPTION: async (filterModule, { filterId, option, optionTexts }) => {
    return await filterModule.createOption(filterId, option, optionTexts);
  },

  REMOVE_OPTION: async (filterModule, { filterId, option }) => {
    return await filterModule.removeOption(filterId, option);
  },

  UPDATE_TEXTS: async (filterModule, { filterId, textUpdates, filterOptionValue }) => {
    return await filterModule.updateTexts(filterId, textUpdates, filterOptionValue);
  },

  GET_TEXTS: async (filterModule, { filterId, filterOptionValue }) => {
    return await filterModule.getTexts(filterId, filterOptionValue);
  },
};

export default actionHandlers;
