import { SearchAssortmentConfiguration } from './search.js';

export const assortmentFulltextSearch =
  ({ filterSelector, assortmentSelector, sortStage, filterActions }: SearchAssortmentConfiguration) =>
  async (assortmentIds: Array<string>) => {
    const foundAssortmentIds = await filterActions.searchAssortments(
      { assortmentIds },
      {
        filterSelector,
        assortmentSelector,
        sortStage,
      },
    );
    return foundAssortmentIds || [];
  };
