import { FilterDirector } from 'meteor/unchained:core-filters';

export default ({
  query,
  filterSelector,
  productSelector,
  sortStage,
}) => async (productIdResolver) => {
  const { queryString } = query;
  if (!queryString) return productIdResolver;

  const director = new FilterDirector({
    query,
  });
  return director.search(productIdResolver, {
    filterSelector,
    productSelector,
    sortStage,
  });
};
