/* eslint-disable import/prefer-default-export */
import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';

import { ObjectsCollection } from './collections';

ObjectsCollection.attachSchema(
  new SimpleSchema(
    {
      putURL: { type: String, required: true },
      expires: { type: Date, required: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);

export default () => {
  ObjectsCollection.rawCollection().createIndex({
    created: -1,
  });
};
