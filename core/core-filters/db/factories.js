import { fakeTimestampFields } from 'meteor/unchained:utils';
import { Factory } from 'meteor/dburles:factory';
import { Filters } from './collections';
import { FilterTypes } from './schema';

Factory.define('filter', Filters, {
  type: () => FilterTypes.SINGLE_CHOICE,
  key: () => 'publicare.category',
  options: () => ['INKO AB', 'COLOSTOMIE', 'ISK'],
  ...fakeTimestampFields,
});
