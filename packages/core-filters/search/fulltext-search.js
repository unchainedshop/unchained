import { FilterDirector } from 'meteor/unchained:core-filters';

export default ({
  query,
  filterSelector,
  productSelector,
  assortmentSelector,
  sortStage,
  ...rest
}) => async (productIdResolver) => {
  const director = new FilterDirector({
    query,
    ...rest,
  });

  return director.search(productIdResolver, {
    filterSelector,
    ...(productSelector && { productSelector }),
    ...(assortmentSelector && { assortmentSelector }),
    sortStage,
  });
};
