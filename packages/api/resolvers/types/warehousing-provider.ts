import { WarehousingProviderHelperTypes } from '@unchainedshop/types/warehousing';

export const WarehousingProvider: WarehousingProviderHelperTypes = {
  interface(obj, _, { modules }) {
    const Interface = modules.warehousing.findInterface(obj);
    if (!Interface) return null;
    return Interface;
  },

  configurationError(obj, _, { modules }) {
    return modules.warehousing.configurationError(obj);
  },

  isActive(obj, _, { modules }) {
    return modules.warehousing.isActive(obj);
  }
};
