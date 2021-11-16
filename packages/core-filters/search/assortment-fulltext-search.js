import { FilterDirector } from 'meteor/unchained:core-filters';

export default ({
    query,
    filterSelector,
    assortmentSelector,
    sortStage,
    ...options
  }) =>
  async (productIdResolver) => {
    const director = new FilterDirector({
      query,
      ...options,
    });

    const foundAssortmentIds = await director.searchAssortments(
      productIdResolver,
      {
        filterSelector,
        assortmentSelector,
        sortStage,
      }
    );
    return foundAssortmentIds || [];
  };
