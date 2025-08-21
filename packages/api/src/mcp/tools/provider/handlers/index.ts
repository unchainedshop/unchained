import createProvider from './createProvider.js';
import updateProvider from './updateProvider.js';
import removeProvider from './removeProvider.js';
import getProvider from './getProvider.js';
import listProviders from './listProviders.js';
import getProviderInterfaces from './getProviderInterfaces.js';

export default {
  CREATE: createProvider,
  UPDATE: updateProvider,
  REMOVE: removeProvider,
  GET: getProvider,
  LIST: listProviders,
  INTERFACES: getProviderInterfaces,
};
