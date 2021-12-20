import { IBaseAdapter, IBaseDirector } from '@unchainedshop/types/common';
import { log } from 'meteor/unchained:logger';

export const BaseDirector = <Adapter extends IBaseAdapter>(
  sortKey?: string
): IBaseDirector<Adapter> => {
  const Adapters = new Map<string, Adapter>();
  return {
    getAdapter: (key) => {
      return Adapters.get(key);
    },

    getAdapters: () => {
      const sort = sortKey || 'key';
      return Array.from(Adapters.values()).sort(
        (left, right) => left[sort] - right[sort]
      );
    },

    registerAdapter: (Adapter) => {
      log(
        `BaseDirector -> Registered ${Adapter.key} ${Adapter.version} (${Adapter.label})`
      );

      Adapters.set(Adapter.key, Adapter);
    },
  };
};
