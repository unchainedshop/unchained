import { Schemas } from 'meteor/unchained:utils';
import { Migrations } from 'meteor/percolate:migrations';
import SimpleSchema from 'simpl-schema';
import { WarehousingProviders } from './collections';

export const WarehousingProviderType = { // eslint-disable-line
  PHYSICAL: 'PHYSICAL'
};

WarehousingProviders.attachSchema(
  new SimpleSchema(
    {
      type: { type: String, required: true, index: true },
      authorId: { type: String, required: true },
      adapterKey: { type: String, required: true },
      configuration: { type: Array },
      'configuration.$': { type: Object },
      'configuration.$.key': { type: String },
      'configuration.$.value': { type: String },
      ...Schemas.timestampFields
    },
    { requiredByDefault: false }
  )
);

Migrations.add({
  version: 20190506.1,
  name: 'Add default authorId',
  up() {
    WarehousingProviders.find()
      .fetch()
      .forEach(({ _id }) => {
        WarehousingProviders.update(
          { _id },
          {
            $set: {
              authorId: 'root'
            }
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
              authorId: 1
            }
          }
        );
      });
  }
});
