import user from './mock/user-mock'
import {buildFindSelector,  removeConfidentialServiceHashes} from '../src/module/configureUsersModule'
import { User } from '@unchainedshop/types/user';

describe('User', () => {
  describe('removeConfidentialServiceHashes', () => {
    it('Should remove sensitive user credentials ', async () => {
      expect(user.services).not.toBeUndefined()
      removeConfidentialServiceHashes(user as unknown as User)
      expect(user.services).toBeUndefined()
    });

  
  })

  describe('buildFindSelector', () => {
    it('Return the correct filter when no parameter is passed', async () => {
      expect(buildFindSelector({})).toEqual({     "deleted": null,    guest: { '$in': [false, null] },
    })
    });
    it('Return the correct filter when no parameter is passed queryString and includeGuest: true', async () => {
      expect(buildFindSelector({queryString: "Hello world", includeGuests: true})).toEqual({ "deleted": null,'$text': { '$search': 'Hello world' } })
    });

    it('Should include additional user field selector in addition too queryString and includeGuests', async () => {
      expect(buildFindSelector({queryString: "Hello world", includeGuests: false, "profile.displayName": "mikael"})).toEqual({
        'profile.displayName': 'mikael',
        "deleted": null,
        guest: { '$in': [false, null] },
        '$text': { '$search': 'Hello world' }
      })
    });
  })
  
});
