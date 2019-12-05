import { fakeTimestampFields } from 'meteor/unchained:utils';
import { Factory } from 'meteor/dburles:factory';
import faker from 'faker';

import { WorkQueue } from './collections';

Factory.define('worker_tasks', WorkQueue, {
  started: () => (faker.random.boolean() ? faker.date.past() : null),
  status: () => 'NEW',
  stopped: () => null,
  priority: () => faker.random.number({ min: 0, max: 10 }),
  type: () => faker.random.arrayElement(['email']),
  input: () => ({
    data: faker.random.words
  }),
  ...fakeTimestampFields
});
