import SimpleSchema from 'simpl-schema';

export default new SimpleSchema(
  {
    telNumber: String,
    emailAddress: String,
  },
  { requiredByDefault: false },
);
