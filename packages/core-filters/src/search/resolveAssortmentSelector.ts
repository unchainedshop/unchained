const defaultSelector = ({ includeInactive = false }) => {
  return !includeInactive ? { isActive: true } : {};
};

export const resolveAssortmentSelector = (query?: {
  includeInactive?: boolean;
}) => {
  return defaultSelector(query);
};
