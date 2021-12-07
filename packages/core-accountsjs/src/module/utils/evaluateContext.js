export const evaluateContext = (filteredContext) => {
  const {
    userId: userIdBeforeLogin,
    localeContext,
    modules, // Do not propagate further
    services, // Do not propagate further
    ...handlerContext
  } = filteredContext;

  return {
    userIdBeforeLogin,
    normalizedLocale: localeContext && localeContext.normalized,
    ...handlerContext,
  };
}
