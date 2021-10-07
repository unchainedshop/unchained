import { assert } from 'chai';
import { SchemaFields, AddressSchema, ContactSchema } from '../lib/mongodb-utils';

describe('Test exports', () => {
  it('Schemas', () => {
    assert.isDefined(AddressSchema);
    assert.isDefined(ContactSchema);
  });

  it('Fields', () => {
    assert.isDefined(SchemaFields)

    assert.isDefined(SchemaFields.contextFields);
    assert.isDefined(SchemaFields.logFields);
    assert.isDefined(SchemaFields.timestampFields);
  });
});
