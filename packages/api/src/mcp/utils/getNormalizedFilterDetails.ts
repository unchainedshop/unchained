import { Context } from '../../context.js';

export async function getNormalizedFilterDetails(filterId: string, context: Context) {
  const { modules, locale, loaders } = context;
  const filter = await modules.filters.findFilter({ filterId });

  const texts = await loaders.filterTextLoader.load({
    filterId,
    filterOptionValue: null,
    locale,
  });

  const options = await (filter.options || []).map((filterOption) => ({
    ...filter,
    filterOption,
  }));

  return {
    ...filter,
    options,
    texts,
  };
}
