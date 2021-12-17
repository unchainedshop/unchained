// import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';
import { registerEvents } from 'meteor/unchained:director-events';
import runMigrations from './db/migrations';

export * from './db/product-media';
export * from './db/product-variations';
export * from './db/product-reviews';
export * from './db/products';

const PRODUCT_EVENTS = [
  'PRODUCT_ADD_ASSIGNMENT',
  'PRODUCT_ADD_MEDIA',
  'PRODUCT_REVIEW_ADD_VOTE',
  'PRODUCT_CREATE',
  'PRODUCT_CREATE_BUNDLE_ITEM',
  'PRODUCT_REVIEW_CREATE',
  'PRODUCT_CREATE_VARIATION',
  'PRODUCT_VARIATION_OPTION_CREATE',
  'PRODUCT_REMOVE_BUNDLE_ITEM',
  'PRODUCT_REMOVE',
  'PRODUCT_REMOVE_ASSIGNMENT',
  'PRODUCT_REMOVE_MEDIA',
  'PRODUCT_REMOVE_REVIEW',
  'PRODUCT_REMOVE_REVIEW_VOTE',
  'PRODUCT_REMOVE_VARIATION',
  'PRODUCT_REMOVE_VARIATION_OPTION',
  'PRODUCT_REORDER_MEDIA',
  'PRODUCT_PUBLISH',
  'PRODUCT_UNPUBLISH',
  'PRODUCT_UPDATE',
  'PRODUCT_UPDATE_MEDIA_TEXT',
  'PRODUCT_UPDATE_REVIEW',
  'PRODUCT_UPDATE_TEXTS',
  'PRODUCT_UPDATE_VARIATION_TEXTS',
];
export default () => {
  // configure
  runMigrations();
  registerEvents(PRODUCT_EVENTS);
};
