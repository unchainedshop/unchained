import { FilterDirector } from 'meteor/unchained:core-filters';

export default ({
  query,
  filterSelector,
  productSelector,
  sortStage,
  ...rest
}) => {
  const director = new FilterDirector({
    query,
    ...rest,
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
