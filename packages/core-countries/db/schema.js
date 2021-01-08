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
      authorId: { type: String, required: true },
      defaultCurrencyId: String,
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);

Migrations.add({
  version: 20200914.2,
  name: 'drop country related indexes',
  up() {
    Countries.rawCollection()
      .dropIndexes()
      .catch(() => {});
  },
  down() {},
});


Migrations.add({
  version: 20210108.2,
  name: 'remove isBase',
  up() {
    Countries.update({}, { $unset: { isBase: 1 } }, { multi: true, bypassCollection2: true })
  },
  down() {},
});

export default () => {
  Countries.rawCollection().createIndex({ isoCode: 1 }, { unique: true });
};
