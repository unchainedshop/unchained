// import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';
import './db/factories';
import initHelpers from './db/helpers';

export * from './db/schema';
export * from './db/collections';
export default () => {
  // configure
  initHelpers();
};
