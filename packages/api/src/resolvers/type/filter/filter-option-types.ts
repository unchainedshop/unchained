import { Context } from '../../../context.js';
import { FilterOption as FilterOptionType } from '@unchainedshop/core-filters';

export const FilterOption = {
  _id(obj: FilterOptionType) {
    return `${obj._id}:${obj.filterOption}`;
  },

  value(obj: FilterOptionType) {
    return obj.filterOption;
  },

  async texts(
    obj: FilterOptionType,
    { forceLocale }: { forceLocale?: string },
    { locale, loaders }: Context,
  ) {
    return loaders.filterTextLoader.load({
      filterId: obj._id,
      filterOptionValue: obj.filterOption,
      locale: forceLocale ? new Intl.Locale(forceLocale) : locale,
    });
  },
};
