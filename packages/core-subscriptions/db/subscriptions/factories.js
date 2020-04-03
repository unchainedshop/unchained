import { fakeTimestampFields } from 'meteor/unchained:utils';
import { Factory } from 'meteor/dburles:factory';
import { Subscriptions } from './collections';

Factory.define('subscription', Subscriptions, {
  userId: () => Factory.get('user'),
  ...fakeTimestampFields,
});
