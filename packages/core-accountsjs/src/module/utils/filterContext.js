export const filterContext = (graphqlContext) => {
  return Object.fromEntries(
    Object.entries(graphqlContext).filter(([key]) => {
      if (key.substr(0, 1) === '_') return false;
      return true;
    })
  );
}
