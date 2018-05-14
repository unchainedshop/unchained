import SimpleSchema from 'simpl-schema';

export default new SimpleSchema({
  telNumber: String,
  emailAddress: {
    type: String,
    regEx: SimpleSchema.RegEx.Email,
  },
}, { requiredByDefault: false });
