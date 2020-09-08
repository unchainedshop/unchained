import { FilterDirector } from 'meteor/unchained:core-filters';

export default ({
  query,
  filterSelector,
  assortmentSelector,
  sortStage,
  ...rest
}) => async (productIdResolver) => {
  const director = new FilterDirector({
    query,
    ...rest,
  });

  return director.searchAssortments(productIdResolver, {
    filterSelector,
    assortmentSelector,
    sortStage,
  });
};
