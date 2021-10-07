import SimpleSchema from 'simpl-schema';

export const ContactSchema = new SimpleSchema(
  {
    telNumber: String,
    emailAddress: String,
  },
  { requiredByDefault: false }
);
