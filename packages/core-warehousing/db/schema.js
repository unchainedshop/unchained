import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import { Migrations } from 'meteor/percolate:migrations';

import { WarehousingProviders } from './collections';

// eslint-disable-next-line
export const WarehousingProviderType = {
  PHYSICAL: 'PHYSICAL',
};

WarehousingProviders.attachSchema(
  new SimpleSchema(
    {
      type: { type: String, required: true },
      adapterKey: { type: String, required: true },
      authorId: { type: String, required: true },
      configuration: Array,
      'configuration.$': Object,
      'configuration.$.key': String,
      'configuration.$.value': String,
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);

Migrations.add({
  version: 20200728.6,
  name: 'Add default authorId to warehousing provider',
  up() {
    WarehousingProviders.find()
      .fetch()
      .forEach(({ _id }) => {
        WarehousingProviders.update(
          { _id },
          {
            $set: {
              authorId: 'root',
            },
          }
        );
      });
  },
  down() {
    WarehousingProviders.find()
      .fetch()
      .forEach(({ _id }) => {
        WarehousingProviders.update(
          { _id },
          {
            $unset: {
              authorId: 1,
            },
          }
        );
      });
  },
});

Migrations.add({
  version: 20200916.1,
  name: 'drop WarehousingProvider related indexes',
  up() {
    WarehousingProviders.rawCollection()
      .dropIndexes()
      .catch(() => {});
  },
  down() {},
});

export default () => {
  Migrations.migrateTo('latest');
  WarehousingProviders.rawCollection().createIndex({ type: 1 });
};
