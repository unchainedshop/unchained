import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import { Logs } from './collections';

const ONE_DAY_IN_SECONDS = 86400;

Logs.attachSchema(
  new SimpleSchema(
    {
      level: { type: String, required: true },
      message: { type: String, required: true },
      meta: { type: Object, blackbox: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);

export default () => {
  Logs.rawCollection().createIndex(
    {
      created: -1,
    },
    { expireAfterSeconds: 2 * ONE_DAY_IN_SECONDS }
  );
};
