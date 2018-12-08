import { log } from 'meteor/unchained:core-logger';

export default (root, _, { userId }) => {
  log('mutation captureOrder', { userId });
  fatalError('not implemented'); // eslint-disable-line
};
