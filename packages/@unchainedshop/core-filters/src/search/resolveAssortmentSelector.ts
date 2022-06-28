type SelectorQuery = {
  includeInactive?: boolean;
};
const defaultSelector = (query: SelectorQuery = { includeInactive: false }) => {
  return !query.includeInactive ? { isActive: true } : {};
};

export const resolveAssortmentSelector = (query?: SelectorQuery) => {
  return defaultSelector(query);
};
