import { log } from 'meteor/unchained:core-logger';

export default function shopInfo(root, _, { userId }) {
  log('query shopInfo', { userId });
  return {
    version: global._UnchainedAPIVersion, // eslint-disable-line
  };
}
