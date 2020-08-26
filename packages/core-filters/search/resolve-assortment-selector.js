import { FilterDirector } from 'meteor/unchained:core-filters';

const defaultSelector = ({ includeInactive = false }) => {
  return !includeInactive ? { isActive: true } : {};
};

export default async (query) => {
  const selector = defaultSelector(query);
  const director = new FilterDirector({ query });
  return director.buildAssortmentSelector(selector);
};
