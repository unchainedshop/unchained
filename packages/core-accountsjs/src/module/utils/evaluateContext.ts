import { UnchainedCore } from '@unchainedshop/types/core.js';

export const evaluateContext = (filteredContext: UnchainedCore) => {
  // TODO: userId, user & localeContext not set following the type

  const {
    userId: userIdBeforeLogin,
    user: userBeforeLogin,
    localeContext,
    ...handlerContext
  } = filteredContext as any;

  return {
    userIdBeforeLogin,
    userBeforeLogin,
    normalizedLocale: localeContext && localeContext.normalized,
    ...handlerContext,
  };
};
