export const evaluateContext = (filteredContext) => {
  const {
    userId: userIdBeforeLogin,
    user: userBeforeLogin,
    localeContext,
    ...handlerContext
  } = filteredContext;

  return {
    userIdBeforeLogin,
    userBeforeLogin,
    normalizedLocale: localeContext && localeContext.normalized,
    ...handlerContext,
  };
};
