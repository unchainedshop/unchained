import { log } from 'meteor/unchained:core-logger';
import { UnchainedServerContext } from '../../api';

export default function shopInfo(
  _,
  __,
  context: UnchainedServerContext
): { version: string } {
  log('query shopInfo', { userId: context.userId });
  return {
    version: context.version,
  };
}
