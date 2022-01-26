import { IBaseAdapter, IBaseDirector } from '@unchainedshop/types/common';
import { log } from 'meteor/unchained:logger';

export const BaseDirector = <Adapter extends IBaseAdapter>(
  directorName: string,
  options?: {
    adapterSortKey?: string;
    adapterKeyField?: string; // Set to 'key' per default
  },
): IBaseDirector<Adapter> => {
  const Adapters = new Map<string, Adapter>();
  const keyField = options?.adapterKeyField || 'key';

  return {
    getAdapter: (key) => {
      return Adapters.get(key);
    },

    getAdapters: ({ adapterFilter } = {}) => {
      const sortKey = options?.adapterSortKey || keyField;
      return Array.from(Adapters.values())
        .sort((left, right) => left[sortKey] - right[sortKey])
        .filter(adapterFilter || (() => true));
    },

    registerAdapter: (Adapter) => {
      log(
        `${directorName} -> Registered ${keyField !== 'key' ? `${Adapter[keyField]} ` : ' '} ${
          Adapter.key
        } ${Adapter.version} (${Adapter.label})`,
      );

      Adapters.set(Adapter[keyField], Adapter);
    },
  };
};
