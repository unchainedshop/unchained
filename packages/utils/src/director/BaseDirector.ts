import { IBaseAdapter, IBaseDirector } from '@unchainedshop/types/common';
import { log } from 'meteor/unchained:logger';

export const BaseDirector = <Adapter extends IBaseAdapter>(options?: {
  adapterSortKey: string;
}): IBaseDirector<Adapter> => {
  const Adapters = new Map<string, Adapter>();
  return {
    getAdapter: (key) => {
      return Adapters.get(key);
    },

    getAdapters: () => {
      const sortKey = options?.adapterSortKey || 'key';
      return Array.from(Adapters.values()).sort(
        (left, right) => left[sortKey] - right[sortKey]
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
