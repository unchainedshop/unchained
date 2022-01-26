import { registerEvents } from 'meteor/unchained:events';
import addMigrations from './migrations';
import settings from './settings';
import createIndexes from './createIndexes';

export * from './db/assortment-media';
export * from './db/assortments';

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
  'ASSORTMENT_REORDER_MEDIA',
  'ASSORTMENT_UPDATE_MEDIA_TEXT',
  'ASSORTMENT_REMOVE_MEDIA',
  'ASSORTMENT_ADD_MEDIA',
];

export default (options, { migrationRepository }) => {
  // settings.load(options);
  addMigrations(migrationRepository);
  // createIndexes();
  // registerEvents(ASSORTMENT_EVENTS);
};
