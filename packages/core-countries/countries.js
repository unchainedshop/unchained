import './db/factories';
import './db/schema';
import initHelpers from './db/helpers';

export * from './db/collections';
export default () => {
  // configure
  initHelpers();
};
