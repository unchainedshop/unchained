import { Context } from '@unchainedshop/types/api';
import { Filter as FilterType, FilterOption, FilterText } from '@unchainedshop/types/filters';

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

  texts: async (obj, { forceLocale }, { modules, localeContext }) => {
    return modules.filters.texts.findLocalizedText({
      filterId: obj._id,
      locale: forceLocale || localeContext.normalized,
    });
  },
};
