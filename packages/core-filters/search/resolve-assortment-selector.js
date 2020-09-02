const defaultSelector = ({ includeInactive = false }) => {
  return !includeInactive ? { isActive: true } : {};
};

export default async (query) => {
  return defaultSelector(query);
};
