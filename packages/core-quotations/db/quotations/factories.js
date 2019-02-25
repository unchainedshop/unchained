import { fakeTimestampFields } from 'meteor/unchained:utils';
import { Factory } from 'meteor/dburles:factory';
import faker from 'faker';
import { Quotations } from './collections';

Factory.define('quotation', Quotations, {
  isoCode: () => null,
  authorId: () => Factory.get('user'),
  isActive: () => faker.random.boolean(),
  isBase: () => false,
  ...fakeTimestampFields,
});
