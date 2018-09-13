import { fakeTimestampFields } from 'meteor/unchained:utils';
import { Factory } from 'meteor/dburles:factory';
import { Filters } from './collections';
import { FilterType } from './schema';

Factory.define('filter', Filters, {
  type: () => FilterType.SINGLE_CHOICE,
  key: () => 'publicare.category',
  options: () => ['INKO AB', 'COLOSTOMIE', 'ISK'],
  ...fakeTimestampFields,
});
