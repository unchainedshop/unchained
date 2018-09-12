import { fakeTimestampFields } from 'meteor/unchained:utils';
import { Factory } from 'meteor/dburles:factory';
import { Filters } from './collections';
import { FilterType } from './schema';

Factory.define('filter', Filters, {
  adapterKey: () => 'ch.dagobert.warehousing.manual-stock',
  type: () => FilterType.PHYSICAL,
  configuration: () => [],
  ...fakeTimestampFields,
});
