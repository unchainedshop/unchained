import { User } from '@unchainedshop/types/user.js';
import { removeConfidentialServiceHashes } from './configureUsersModule.js';
import user from '../../tests/mock/user-mock.js';

describe('removeConfidentialServiceHashes', () => {
  it('Should remove sensitive user credentials ', async () => {
    expect(user.services).not.toBeUndefined();
    removeConfidentialServiceHashes(user as unknown as User);
    expect(user.services).toBeUndefined();
  });
});
