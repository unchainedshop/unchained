import { WarehousingProviderHelperTypes } from '@unchainedshop/types/warehousing.js';

export const WarehousingProvider: WarehousingProviderHelperTypes = {
  interface(obj, _, context) {
    const Interface = context.modules.warehousing.findInterface(obj);
    if (!Interface) return null;
    return Interface;
  },

  async configurationError(obj, _, context) {
    return context.modules.warehousing.configurationError(obj, context);
  },

  async isActive(obj, _, context) {
    return context.modules.warehousing.isActive(obj, context);
  },
};
