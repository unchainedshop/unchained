import { fakeTimestampFields } from 'meteor/unchained:utils';
import { Factory } from 'meteor/dburles:factory';
import faker from 'faker';
import { Languages } from './collections';

Factory.define('language', Languages, {
  isoCode: () => null,
  authorId: () => Factory.get('user'),
  isActive: () => faker.random.boolean(),
  isBase: () => false,
  ...fakeTimestampFields,
});
