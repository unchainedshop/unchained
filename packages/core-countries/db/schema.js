import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import { Migrations } from 'meteor/percolate:migrations';

import { Countries } from './collections';

Countries.attachSchema(
  new SimpleSchema(
    {
      isoCode: {
        type: String,
        required: true,
      },
      isActive: Boolean,
      isBase: Boolean,
      authorId: { type: String, required: true },
      defaultCurrencyId: String,
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false },
  ),
);

Migrations.add({
  version: 20200914.2,
  name: 'drop country related indexes',
  up() {
    Countries.rawCollection().dropIndexes();
  },
  down() {},
});

export default () => {
  Migrations.migrateTo('latest');
  Countries.rawCollection().createIndex({ isoCode: 1 }, { unique: true });
};
