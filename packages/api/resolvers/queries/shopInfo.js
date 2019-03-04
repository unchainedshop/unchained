import { log } from 'meteor/unchained:core-logger';

const VERSION = '0.1-beta1';

export default function(root, _, { userId }) {
  log('query shopInfo', { userId });
  return {
    version: VERSION
  };
}
