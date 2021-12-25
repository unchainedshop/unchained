import { IBaseAdapter, IBaseDirector } from '@unchainedshop/types/common';
import { log } from 'meteor/unchained:logger';

export const BaseDirector = <Adapter extends IBaseAdapter>(options?: {
  adapterSortKey?: string;
}): IBaseDirector<Adapter> => {
  const Adapters = new Map<string, Adapter>();
  return {
    getAdapter: (key) => {
      return Adapters.get(key);
    },

    getAdapters: ({ adapterFilter } = {}) => {
      const sortKey = options?.adapterSortKey || 'key';
      return Array.from(Adapters.values())
        .sort((left, right) => left[sortKey] - right[sortKey])
        .filter(adapterFilter || (() => true));
    },

    registerAdapter: (Adapter) => {
      log(
        `BaseDirector -> Registered ${Adapter.key} ${Adapter.version} (${Adapter.label})`
      );

      Adapters.set(Adapter.key, Adapter);
    },
  };
};
