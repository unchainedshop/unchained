import { describe, it } from 'node:test';
import assert from 'node:assert';
import { removeConfidentialServiceHashes } from './configureUsersModule.ts';
import user from '../../tests/mock/user-mock.ts';
import type { User } from '../db/UsersCollection.ts';

describe('removeConfidentialServiceHashes', () => {
  it('Should remove sensitive user credentials ', () => {
    assert.notStrictEqual(user.services, undefined);
    assert.strictEqual(removeConfidentialServiceHashes(user as unknown as User)?.services, undefined);
  });
});
