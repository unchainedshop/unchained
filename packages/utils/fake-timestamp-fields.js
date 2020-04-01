import faker from 'faker';

export default {
  created: () => faker.date.past(),
  updated: () => (faker.random.boolean() ? faker.date.past() : null),
};
