import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import { Languages } from './collections';

Languages.attachSchema(
  new SimpleSchema(
    {
      isoCode: {
        type: String,
        required: true,
      },
      isActive: Boolean,
      authorId: { type: String, required: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);

export default () => {
  Languages.rawCollection().createIndex({ isoCode: 1 }, { unique: true });
};
