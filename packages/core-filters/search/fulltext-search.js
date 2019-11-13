import { FilterDirector } from 'meteor/unchained:core-filters';

export default ({
  query,
  filterSelector,
  productSelector
}) => async productIdResolver => {
  const director = new FilterDirector({
    query
  });
  return director.search(productIdResolver, {
    filterSelector,
    productSelector
  });
};
