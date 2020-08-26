import { log } from 'meteor/unchained:core-logger';
import { WarehousingProviders } from 'meteor/unchained:core-warehousing';

export default (root, { warehousingProvider }, { userId }) => {
  log('mutation createWarehousingProvider', { userId });
  return WarehousingProviders.createProvider({
    ...warehousingProvider,
    authorId: userId,
  });
};
