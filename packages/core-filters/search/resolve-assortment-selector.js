import { FilterDirector } from 'meteor/unchained:core-filters';

const defaultSelector = ({ includeInactive }) => {
  const selector = {
    isActive: { $in: [true, false] },
  };
  if (!includeInactive) {
    selector.isActive = true;
  }
  return selector;
};

export default async (query) => {
  const selector = defaultSelector(query);
  const director = new FilterDirector({ query });
  return director.buildProductSelector(selector);
};
