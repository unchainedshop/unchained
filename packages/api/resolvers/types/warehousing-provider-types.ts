import { WarehousingProviderHelperTypes } from '@unchainedshop/types/warehousing';

export const WarehousingProvider: WarehousingProviderHelperTypes = {
  interface(obj, _, { modules }) {
    const Interface = modules.warehousing.findInterface(obj);
    if (!Interface) return null;
    return Interface;
  },

  async configurationError(obj, _, context) {
    return context.modules.warehousing.configurationError(obj, context);
  },

  isActive(obj, _, context) {
    return context.modules.warehousing.isActive(obj, context);
  },
};
