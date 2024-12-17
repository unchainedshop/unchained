import { removeConfidentialServiceHashes } from './configureUsersModule.js';
import user from '../../tests/mock/user-mock.js';
import { User } from '../db/UsersCollection.js';

describe('removeConfidentialServiceHashes', () => {
  it('Should remove sensitive user credentials ', () => {
    expect(user.services).not.toBeUndefined();
    removeConfidentialServiceHashes(user as unknown as User);
    expect(user.services).toBeUndefined();
  });
});
