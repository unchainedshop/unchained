import { Context } from '../../context.js';
import { FilterDirector } from '@unchainedshop/core';
import { FilterNotFoundError } from '../../errors.js';
import { getNormalizedFilterDetails } from '../utils/getNormalizedFilterDetails.js';

export type FilterType = 'SWITCH' | 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'RANGE';

export interface FilterEntity {
  key: string;
  type: FilterType;
  options?: string[];
}

export interface FilterUpdateData {
  isActive?: boolean;
  key?: string;
}

export interface FilterTextInput {
  locale: string;
  title: string;
  subtitle?: string;
}

export interface FilterOptionTextInput {
  locale: string;
  title?: string;
  subtitle?: string;
}

export interface FilterTextsResult {
  filterTexts: any;
  filter: any;
}

export interface FilterUpdateTextInput {
  locale: string;
  title?: string;
  subtitle?: string;
}

export interface FilterListOptions {
  limit?: number;
  offset?: number;
  sort?: {
    key: string;
    value: 'ASC' | 'DESC';
  }[];
  includeInactive?: boolean;
  queryString?: string;
}

export interface FilterCountOptions {
  includeInactive?: boolean;
  queryString?: string;
}

export const configureFilterMcpModule = (context: Context) => {
  const { modules } = context;

  return {
    create: async (filter: FilterEntity, texts?: FilterTextInput[]) => {
      const { key, type, options } = filter as any;

      const newFilter = await modules.filters.create({
        key,
        type,
        options,
        isActive: true,
      });

      await FilterDirector.invalidateProductIdCache(newFilter, context);

      if (texts && texts.length > 0) {
        await modules.filters.texts.updateTexts({ filterId: newFilter._id }, texts);
      }

      const normalizedFilter = await getNormalizedFilterDetails(newFilter._id, context);
      return normalizedFilter;
    },

    update: async (filterId: string, updateData: FilterUpdateData) => {
      if (!(await modules.filters.filterExists({ filterId }))) {
        throw new FilterNotFoundError({ filterId });
      }

      await modules.filters.update(filterId, updateData as any);
      const normalizedFilter = await getNormalizedFilterDetails(filterId, context);
      return normalizedFilter;
    },

    remove: async (filterId: string) => {
      if (!(await modules.filters.filterExists({ filterId }))) {
        throw new FilterNotFoundError({ filterId });
      }

      const assortmentFilters = await modules.assortments.filters.findFilters({ filterId } as any);
      await Promise.all(
        assortmentFilters.map(async (assortmentFilter) => {
          await modules.assortments.filters.delete(assortmentFilter._id);
        }),
      );

      const normalizedFilter = await getNormalizedFilterDetails(filterId, context);
      await modules.filters.delete(filterId);
      return normalizedFilter;
    },

    get: async (filterId: string) => {
      const normalizedFilter = await getNormalizedFilterDetails(filterId, context);
      if (!normalizedFilter) {
        throw new FilterNotFoundError({ filterId });
      }
      return normalizedFilter;
    },

    list: async (options: FilterListOptions = {}) => {
      const { limit = 50, offset = 0, sort, includeInactive = false, queryString } = options;

      const sortOptions = sort?.map((s) => ({ key: s.key, value: s.value as any })) || undefined;

      const filters = await modules.filters.findFilters(
        {
          includeInactive,
          queryString,
        },
        {
          limit,
          skip: offset,
          sort: sortOptions as any,
        },
      );

      return filters;
    },

    count: async (options: FilterCountOptions = {}) => {
      const { includeInactive = false, queryString } = options;

      const count = await modules.filters.count({
        includeInactive,
        queryString,
      });

      return count;
    },

    createOption: async (filterId: string, option: string, texts?: FilterOptionTextInput[]) => {
      if (!(await modules.filters.filterExists({ filterId }))) {
        throw new FilterNotFoundError({ filterId });
      }

      const newOptions = await modules.filters.createFilterOption(filterId, { value: option });
      await FilterDirector.invalidateProductIdCache(newOptions, context);

      if (texts && texts.length > 0) {
        await modules.filters.texts.updateTexts({ filterId, filterOptionValue: option }, texts);
      }

      const normalizedFilter = await getNormalizedFilterDetails(filterId, context);
      return { filter: normalizedFilter };
    },

    removeOption: async (filterId: string, filterOptionValue: string) => {
      if (!(await modules.filters.filterExists({ filterId }))) {
        throw new FilterNotFoundError({ filterId });
      }

      const removedFilterOption = await modules.filters.removeFilterOption({
        filterId,
        filterOptionValue,
      });
      await FilterDirector.invalidateProductIdCache(removedFilterOption, context);

      const normalizedFilter = await getNormalizedFilterDetails(filterId, context);
      return { filter: normalizedFilter };
    },

    updateTexts: async (
      filterId: string,
      texts: FilterUpdateTextInput[],
      filterOptionValue?: string,
    ) => {
      if (!(await modules.filters.filterExists({ filterId }))) {
        throw new FilterNotFoundError({ filterId });
      }

      const updatedTexts = await modules.filters.texts.updateTexts(
        { filterId, filterOptionValue: filterOptionValue || null },
        texts,
      );

      const normalizedFilter = await getNormalizedFilterDetails(filterId, context);
      return { filterTexts: updatedTexts, filter: normalizedFilter };
    },

    getTexts: async (filterId: string, filterOptionValue?: string) => {
      if (!(await modules.filters.filterExists({ filterId }))) {
        throw new FilterNotFoundError({ filterId });
      }

      const texts = await modules.filters.texts.findTexts({
        filterId,
        filterOptionValue: filterOptionValue || null,
      });

      return { texts };
    },
  };
};

export type FilterMcpModule = ReturnType<typeof configureFilterMcpModule>;
