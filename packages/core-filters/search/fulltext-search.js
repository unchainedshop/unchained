import { FilterDirector } from 'meteor/unchained:core-filters';

export default ({
  query,
  filterSelector,
  productSelector,
  sortStage,
  ...rest
}) => async (productIdResolver) => {
  const director = new FilterDirector({
    query,
    ...rest,
  });
  return director.search(productIdResolver, {
    filterSelector,
    productSelector,
    sortStage,
  });
};
