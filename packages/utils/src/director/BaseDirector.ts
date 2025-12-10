import type { IBaseAdapter } from './BaseAdapter.ts';

export interface IBaseDirector<Adapter extends IBaseAdapter> {
  getAdapters: (options?: { adapterFilter?: (adapter: Adapter) => boolean }) => Adapter[];
  getAdapter: (key: string) => Adapter | null;
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
      return Adapters.get(key) || null;
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
