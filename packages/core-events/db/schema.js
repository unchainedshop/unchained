/* eslint-disable import/prefer-default-export */
import { Schemas } from 'meteor/unchained:utils';
import { Migrations } from 'meteor/percolate:migrations';
import SimpleSchema from 'simpl-schema';

import { Events } from './collections';

Events.attachSchema(
  new SimpleSchema(
    {
      type: { type: String, required: true },
      payload: { type: Object, blackbox: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);

Migrations.add({
  version: 20210318,
  name: 'drop event indexes',
  up() {
    Events.rawCollection()
      .dropIndexes()
      .catch(() => {});
  },
  down() {},
});

export default () => {
  Events.rawCollection().createIndex({
    created: -1,
  });
  Events.rawCollection().createIndex({ type: 1 });
};
