import createProvider from './createProvider.ts';
import updateProvider from './updateProvider.ts';
import removeProvider from './removeProvider.ts';
import getProvider from './getProvider.ts';
import listProviders from './listProviders.ts';
import getProviderInterfaces from './getProviderInterfaces.ts';

export default {
  CREATE: createProvider,
  UPDATE: updateProvider,
  REMOVE: removeProvider,
  GET: getProvider,
  LIST: listProviders,
  INTERFACES: getProviderInterfaces,
};
