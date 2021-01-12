import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import { Migrations } from 'meteor/percolate:migrations';

import { Currencies } from './collections';

Currencies.attachSchema(
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

Migrations.add({
  version: 20200914.3,
  name: 'drop currencies related indexes',
  up() {
    Currencies.rawCollection()
      .dropIndexes()
      .catch(() => {});
  },
  down() {},
});

export default () => {
  Currencies.rawCollection().createIndex({ isoCode: 1 }, { unique: true });
};
