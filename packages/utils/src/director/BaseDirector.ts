import { IBaseAdapter } from './BaseAdapter.js';

export interface IBaseDirector<Adapter extends IBaseAdapter> {
  getAdapters: (options?: { adapterFilter?: (adapter: Adapter) => boolean }) => Adapter[];
  getAdapter: (key: string) => Adapter;
  registerAdapter: (A: Adapter) => void;
  unregisterAdapter: (key: string) => boolean;
}

export const BaseDirector = <AdapterType extends IBaseAdapter>(
  directorName: string,
  options?: {
    adapterSortKey?: string;
    adapterKeyField?: string; // Set to 'key' per default
  },
): IBaseDirector<AdapterType> => {
  const Adapters = new Map<string, AdapterType>();
  const keyField = options?.adapterKeyField || 'key';

  return {
    getAdapter: (key) => {
      return Adapters.get(key);
    },

    getAdapters: ({ adapterFilter } = {}) => {
      const sortKey = options?.adapterSortKey || keyField;
      return Array.from(Adapters.values())
        .toSorted((left, right) => left[sortKey] - right[sortKey])
        .filter(adapterFilter || (() => true));
    },

    registerAdapter: (Adapter) => {
      Adapters.set(Adapter[keyField], Adapter);
    },

    unregisterAdapter: (key) => {
      return Adapters.delete(key);
    },
  };
};
