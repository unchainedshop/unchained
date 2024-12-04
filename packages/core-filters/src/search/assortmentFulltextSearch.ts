import { mongodb } from '@unchainedshop/mongodb';
import { Filter } from '../db/FiltersCollection.js';

export const assortmentFulltextSearch =
  <Assortment = unknown>(
    { filterSelector, assortmentSelector, sortStage },
    filterActions: {
      searchAssortments: (
        params: {
          assortmentIds: Array<string>;
        },
        options?: {
          filterSelector: mongodb.Filter<Filter>;
          assortmentSelector: mongodb.Filter<Assortment>;
          sortStage: mongodb.FindOptions['sort'];
        },
      ) => Promise<Array<string>>;
    },
  ) =>
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
