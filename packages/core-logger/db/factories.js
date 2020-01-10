import { Factory } from 'meteor/dburles:factory';
import { fakeTimestampFields } from 'meteor/unchained:utils';
import faker from 'faker';
import { Logs } from './collections';

Factory.define('log', Logs, {
  meta: () => ({ userId: Factory.get('user') }),
  level: () => faker.random.arrayElement(['error', 'warn', 'info']),
  message: () => faker.lorem.sentence(),
  ...fakeTimestampFields
});
