import { Schemas } from '@unchainedshop/utils';
import SimpleSchema from 'simpl-schema';

export const FiltersSchema = new SimpleSchema(
  {
    isActive: Boolean,
    key: {
      type: String,
      required: true,
    },
    type: { type: String, required: true },
    options: Array,
    'options.$': String,
    meta: { type: Object, blackbox: true },
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);

export const FilterTextsSchema = new SimpleSchema(
  {
    filterId: { type: String, required: true },
    filterOptionValue: String,
    locale: Intl.Locale,
    title: String,
    subtitle: String,
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);
