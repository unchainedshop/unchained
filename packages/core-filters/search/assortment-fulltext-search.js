import { FilterDirector } from 'meteor/unchained:core-filters';

export default ({
    query,
    filterSelector,
    assortmentSelector,
    sortStage,
    ...rest
  }) =>
  async (productIdResolver) => {
    const director = new FilterDirector({
      query,
      ...rest,
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
