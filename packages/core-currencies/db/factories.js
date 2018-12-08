import { fakeTimestampFields } from 'meteor/unchained:utils';
import { Factory } from 'meteor/dburles:factory';
import faker from 'faker';
import { Currencies } from './collections';

Factory.define('currency', Currencies, {
  isoCode: () => null,
  authorId: () => Factory.get('user'),
  isActive: () => faker.random.boolean(),
  ...fakeTimestampFields,
});
