import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';

export const EventsSchema = new SimpleSchema(
  {
    type: { type: String, required: true },
    payload: { type: Object, blackbox: true },
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false }
);
