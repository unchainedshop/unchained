import {
  WarehousingDirector,
  WarehousingError,
  WarehousingInterface,
  WarehousingProvider as WarehousingProviderType,
} from '@unchainedshop/core-warehousing';
import { Context } from '../../context.js';

export type HelperType<P, T> = (provider: WarehousingProviderType, params: P, context: Context) => T;

export interface WarehousingProviderHelperTypes {
  configurationError: HelperType<never, Promise<WarehousingError>>;
  interface: HelperType<never, WarehousingInterface>;
  isActive: HelperType<never, Promise<boolean>>;
}

export const WarehousingProvider: WarehousingProviderHelperTypes = {
  interface(obj) {
    const Adapter = WarehousingDirector.getAdapter(obj.adapterKey);
    if (!Adapter) return null;
    return {
      _id: Adapter.key,
      label: Adapter.label,
      version: Adapter.version,
    };
  },

  async configurationError(obj, _, context) {
    const actions = await WarehousingDirector.actions(obj, {}, context);
    return actions.configurationError();
  },

  async isActive(obj, _, context) {
    const actions = await WarehousingDirector.actions(obj, {}, context);
    return actions.isActive();
  },
};
