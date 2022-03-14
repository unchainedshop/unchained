import { WarehousingProviderHelperTypes } from '@unchainedshop/types/warehousing';

export const WarehousingProvider: WarehousingProviderHelperTypes = {
  interface(obj, _, { modules }) {
    const Interface = modules.warehousing.findInterface(obj);
    if (!Interface) return null;
    return Interface;
  },

  configurationError(obj, _, requestContext) {
    return requestContext.modules.warehousing.configurationError(obj, requestContext);
  },

  isActive(obj, _, context) {
    return context.modules.warehousing.isActive(obj, context);
  },
};
