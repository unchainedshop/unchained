/* eslint-disable import/prefer-default-export */
import { Schemas } from 'meteor/unchained:utils';
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

export default () => {
  Events.rawCollection().createIndex({
    created: -1,
  });
  Events.rawCollection().createIndex({ type: 1 });
};
