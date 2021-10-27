import { assert } from 'chai';
import { generateDbMutations, Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import { ObjectId } from 'unchained-core-types';

const testUserId = 'user-1234';

const testSchema = new SimpleSchema({
  name: String,
  email: { type: String, optional: true },
  users: { type: Array, defaultValue: [] },
  'users.$': String,
  ...Schemas.timestampFields,
});

const testCollection = {
  insertOne: () =>
    new Promise((resolve) =>
      resolve({ insertedId: new ObjectId('qwerASFF1234') })
    ),
  updateOne: () => new Promise((resolve) => resolve(null)),
  deleteOne: () => new Promise((resolve) => resolve({ deletedCount: 1 })),
};

describe('Test generate DB mutations', () => {
  let mutations;
  let docId;

  it('Create mutations', () => {
    mutations = generateDbMutations(testCollection, testSchema);

    assert.ok(mutations);
    assert.isDefined(mutations.create);
    assert.isDefined(mutations.update);
    assert.isDefined(mutations.delete);
  });
  it('Run insert mutation', async () => {
    docId = await mutations.create({ name: 'Test name' }, testUserId);
    assert.isDefined(docId);

    await mutations
      .create({ email: 'test.email@unchained.shop' }, testUserId)
      .catch((error) => {
        const errorDetails = error.details[0];
        assert.equal(error.error, 'validation-error');
        assert.equal(errorDetails.name, 'name');
        assert.equal(errorDetails.message, 'Name is required');
      });
  });
  it('Run update mutation', async () => {
    let result = await mutations.update(
      docId,
      { $set: { email: 'test.email@unchained.shop' } },
      testUserId
    );
    assert.isUndefined(result);

    result = await mutations.update(
      docId,
      { $push: { users: 'Abc-123' } },
      testUserId
    );
    assert.isUndefined(result);
  });
  it('Run delete mutation', async () => {
    const deletedDocs = await mutations.delete(docId, testUserId);
    assert.equal(deletedDocs, 1);
  });
});
