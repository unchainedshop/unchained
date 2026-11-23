import type { Context } from '../../../context.ts';
import type { Filter as FilterType } from '@unchainedshop/core-filters';
import { FilterDirector } from '@unchainedshop/core';

export const Filter = {
  options: async (obj: FilterType) => {
    return (await FilterDirector.optionValues(obj)).map((filterOption) => ({
      ...obj,
      filterOption,
    }));
  },

  optionsAreGenerated: (obj: FilterType) => FilterDirector.hasGeneratedOptions(obj),

  async texts(obj: FilterType, { forceLocale }: { forceLocale?: string }, { locale, loaders }: Context) {
    return loaders.filterTextLoader.load({
      filterId: obj._id,
      filterOptionValue: null,
      locale: forceLocale ? new Intl.Locale(forceLocale) : locale,
    });
  },
};
