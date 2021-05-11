import { registerEvents } from 'meteor/unchained:core-events';
import runMigrations from './db/schema';
import settings from './settings';

export * from './db/helpers';
export * from './db/collections';

const ASSORTMENT_EVENTS = [
  'ASSORTMENT_CREATE',
  'ASSORTMENT_ADD_FILTER',
  'ASSORTMENT_ADD_LINK',
  'ASSORTMENT_ADD_PRODUCT',
  'ASSORTMENT_REMOVE',
  'ASSORTMENT_REMOVE_FILTER',
  'ASSORTMENT_REMOVE_LINK',
  'ASSORTMENT_REMOVE_PRODUCT',
  'ASSORTMENT_REORDER_PRODUCTS',
  'ASSORTMENT_REORDER_FILTERS',
  'ASSORTMENT_REORDER_LINKS',
  'ASSORTMENT_SET_BASE',
  'ASSORTMENT_UPDATE',
  'ASSORTMENT_UPDATE_TEXTS',
];
export default (options) => {
  settings.load(options);
  runMigrations();
  registerEvents(ASSORTMENT_EVENTS);
};
