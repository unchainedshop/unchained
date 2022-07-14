import { Schemas } from '@unchainedshop/utils';
import SimpleSchema from 'simpl-schema';

export const LanguagesSchema = new SimpleSchema(
  {
    isoCode: { type: String, required: true },
    isActive: Boolean,
    authorId: { type: String, required: true },
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);
