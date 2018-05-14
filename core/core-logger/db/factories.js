import { Factory } from 'meteor/dburles:factory';
import faker from 'faker';
import { fakeTimestampFields } from 'meteor/unchained:utils';
import { Logs } from './collections';

Factory.define('log', Logs, {
  userId: () => Factory.get('user'),
  level: () => faker.random.arrayElement(['error', 'warn', 'info']),
  message: () => faker.lorem.sentence(),
  ...fakeTimestampFields,
});
