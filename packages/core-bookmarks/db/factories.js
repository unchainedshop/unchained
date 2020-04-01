import { fakeTimestampFields } from 'meteor/unchained:utils';
import { Factory } from 'meteor/dburles:factory';
import { Bookmarks } from './collections';

Factory.define('bookmark', Bookmarks, {
  userId: () => Factory.get('user'),
  productId: () => Factory.get('product'),
  ...fakeTimestampFields,
});
