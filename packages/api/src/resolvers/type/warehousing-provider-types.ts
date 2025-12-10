import { WarehousingDirector, type WarehousingError, type WarehousingInterface } from '@unchainedshop/core';
import type { WarehousingProvider as WarehousingProviderType } from '@unchainedshop/core-warehousing';
import type { Context } from '../../context.ts';

export type HelperType<P, T> = (provider: WarehousingProviderType, params: P, context: Context) => T;

export interface WarehousingProviderHelperTypes {
  configurationError: HelperType<never, Promise<WarehousingError | null>>;
  interface: HelperType<never, WarehousingInterface | null>;
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
