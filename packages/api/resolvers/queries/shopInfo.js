import { log } from 'meteor/unchained:core-logger';

export default function (root, _, { userId }) {
  log('query shopInfo', { userId });
  return {
    version: global._UnchainedAPIVersion // eslint-disable-line
  };
}
