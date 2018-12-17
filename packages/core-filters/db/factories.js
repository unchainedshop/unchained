import { fakeTimestampFields } from 'meteor/unchained:utils';
import { Factory } from 'meteor/dburles:factory';
import faker from 'faker';
import { Filters, FilterTexts } from './collections';
import { FilterTypes } from './schema';

Factory.define('filter', Filters, {
  isActive: () => true,
  type: () => FilterTypes.SINGLE_CHOICE,
  key: () => 'size',
  options: () => ['xs', 'x', 'm', 'l', 'xl'],
  ...fakeTimestampFields,
});

Factory.define('filterText', FilterTexts, {
  filterId: () => Factory.get('filter'),
  filterOptionValue: () => null,
  locale: () => faker.random.arrayElement(['de', 'en']),
  title: () => faker.lorem.words(),
  subtitle: () => faker.lorem.sentence(),
  ...fakeTimestampFields,
});
