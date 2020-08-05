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
      type: { type: String, required: true, index: true },
      adapterKey: { type: String, required: true },
      authorId: { type: String, required: true },
      configuration: { type: Array },
      'configuration.$': { type: Object },
      'configuration.$.key': { type: String },
      'configuration.$.value': { type: String },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false },
  ),
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
          },
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
          },
        );
      });
  },
});

export default () => {
  Migrations.migrateTo('latest');
};
