import { Context } from '@unchainedshop/api';
import { Filter as FilterType, FilterOption, FilterText } from '@unchainedshop/types/filters.js';

type HelperType<P, T> = (filter: FilterType, params: P, context: Context) => T;

type FilterHelperTypes = {
  options: HelperType<never, Array<FilterOption>>;
  texts: HelperType<{ forceLocale?: string }, Promise<FilterText>>;
};

export const Filter: FilterHelperTypes = {
  options: (obj) => {
    return (obj.options || []).map((filterOption) => ({
      ...obj,
      filterOption,
    }));
  },

  async texts(obj, { forceLocale }, requestContext) {
    const { localeContext, loaders } = requestContext;
    return loaders.filterTextLoader.load({
      filterId: obj._id,
      filterOptionValue: null,
      locale: forceLocale || localeContext.normalized,
    });
  },
};
