import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import { Migrations } from 'meteor/percolate:migrations';

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

Migrations.add({
  version: 20200914.6,
  name: 'drop languages related indexes',
  up() {
    Languages.rawCollection()
      .dropIndexes()
      .catch(() => {});
  },
  down() {},
});

Migrations.add({
  version: 20210108.3,
  name: 'remove isBase',
  up() {
    Languages.update(
      {},
      { $unset: { isBase: '' } },
      { multi: true, bypassCollection2: true }
    );
  },
  down() {},
});

export default () => {
  Languages.rawCollection().createIndex({ isoCode: 1 }, { unique: true });
};
