import { Context } from '../../../context.js';
import { Filter as FilterType } from '@unchainedshop/core-filters';

export const Filter = {
  options: (obj: FilterType) => {
    return (obj.options || []).map((filterOption) => ({
      ...obj,
      filterOption,
    }));
  },

  async texts(obj: FilterType, { forceLocale }: { forceLocale?: string }, { locale, loaders }: Context) {
    return loaders.filterTextLoader.load({
      filterId: obj._id,
      filterOptionValue: null,
      locale: forceLocale ? new Intl.Locale(forceLocale) : locale,
    });
  },
};
