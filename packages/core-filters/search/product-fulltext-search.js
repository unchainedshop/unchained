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

  const foundProductIds = await director.searchProducts(productIdResolver, {
    filterSelector,
    productSelector,
    sortStage,
  });
  return foundProductIds || [];
};
