import user from './mock/user-mock'
import {buildFindSelector, getUserLocale, removeConfidentialServiceHashes} from '../src/module/configureUsersModule'
import { User } from '@unchainedshop/types/user';
import { Locale } from 'locale';


describe('User', () => {
  describe('removeConfidentialServiceHashes', () => {
    it('Should remove sensitive user credentials ', async () => {
      expect(user.services).not.toBeUndefined()
      removeConfidentialServiceHashes(user as unknown as User)
      expect(user.services).toBeUndefined()
    });

  
  })

  describe('getUserLocale', () => {
    it('Should return users locale context from last login if no localeContext is passed ', async () => {
      expect(getUserLocale(user as unknown as User)).toEqual({
        code: 'de_CH',
        language: 'de',
        country: 'CH',
        normalized: 'de_CH'
      })
    });

    it('Should use the passed locale if provided', async () => {
      expect(getUserLocale(user as unknown as User,{ localeContext: {
        code: 'et',
        language: 'amh',
        country: 'et',
        normalized: 'et'
      } as Locale})).toEqual({
        code: 'et',
        language: 'amh',
        country: 'et',
        normalized: 'et'
      })
    });
  })

  describe('buildFindSelector', () => {
    it('Return the correct filter when no parameter is passed', async () => {
      expect(buildFindSelector({})).toEqual({ guest: { '$ne': true } })
    });
    it('Return the correct filter when no parameter is passed queryString and includeGuest: true', async () => {
      expect(buildFindSelector({queryString: "Hello world", includeGuests: true})).toEqual({ '$text': { '$search': 'Hello world' } })
    });

    it('Should include additional user field selector in addition too queryString and includeGuests', async () => {
      expect(buildFindSelector({queryString: "Hello world", includeGuests: false, "profile.displayName": "mikael"})).toEqual({
        'profile.displayName': 'mikael',
        guest: { '$ne': true },
        '$text': { '$search': 'Hello world' }
      })
    });
  })
  
});
