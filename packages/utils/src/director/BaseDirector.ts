import { log } from '@unchainedshop/logger';
import { IBaseAdapter } from './BaseAdapter.js';

export interface IBaseDirector<Adapter extends IBaseAdapter> {
  getAdapters: (options?: { adapterFilter?: (adapter: Adapter) => boolean }) => Array<Adapter>;
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
        .sort((left, right) => left[sortKey] - right[sortKey])
        .filter(adapterFilter || (() => true));
    },

    registerAdapter: (Adapter) => {
      log(
        `${directorName} -> Registered ${keyField !== 'key' ? `${Adapter[keyField]}` : ''} ${
          Adapter.key
        } ${Adapter.version} (${Adapter.label})`,
      );
      Adapters.set(Adapter[keyField], Adapter);
    },

    unregisterAdapter: (key) => {
      log(`${directorName} -> Unregistered ${key}`);
      return Adapters.delete(key);
    },
  };
};
