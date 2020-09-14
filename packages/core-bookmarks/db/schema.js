import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import { Migrations } from 'meteor/percolate:migrations';
import { Bookmarks } from './collections';

Bookmarks.attachSchema(
  new SimpleSchema(
    {
      userId: { type: String, required: true },
      productId: { type: String, required: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false },
  ),
);

Migrations.add({
  version: 20200914.1,
  name: 'drop bookmark related indexes',
  up() {
    Bookmarks.rawCollection().dropIndexes();
  },
  down() {},
});

export default () => {
  Migrations.migrateTo('latest');
  Bookmarks.rawCollection().createIndex({ userId: 1 });
  Bookmarks.rawCollection().createIndex({ productId: 1 });
};
