import { describe, it } from 'node:test';
import assert from 'node:assert';
import { removeConfidentialServiceHashes } from './configureUsersModule.js';
import user from '../../tests/mock/user-mock.js';
import { User } from '../db/UsersCollection.js';

describe('removeConfidentialServiceHashes', () => {
  it('Should remove sensitive user credentials ', () => {
    assert.notStrictEqual(user.services, undefined);
    assert.strictEqual(removeConfidentialServiceHashes(user as unknown as User)?.services, undefined);
  });
});
