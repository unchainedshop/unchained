import { FilterDirector } from 'meteor/unchained:core-filters';

export default ({
  query,
  filterSelector,
  productSelector,
  sortStage,
  ...options
}) => {
  const director = new FilterDirector({
    query,
    ...options,
  });
  return async (productIdResolver) => {
    const foundProductIds = await director.searchProducts(productIdResolver, {
      filterSelector,
      productSelector,
      sortStage,
    });
    return foundProductIds || [];
  };
};
