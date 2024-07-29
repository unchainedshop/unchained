import { UnchainedCore } from '@unchainedshop/types/core.js';
import {
  WarehousingError,
  WarehousingInterface,
  WarehousingProvider as WarehousingProviderType,
} from '@unchainedshop/core-warehousing';

export type HelperType<P, T> = (
  provider: WarehousingProviderType,
  params: P,
  context: UnchainedCore,
) => T;

export interface WarehousingProviderHelperTypes {
  configurationError: HelperType<never, Promise<WarehousingError>>;
  interface: HelperType<never, WarehousingInterface>;
  isActive: HelperType<never, Promise<boolean>>;
}

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
