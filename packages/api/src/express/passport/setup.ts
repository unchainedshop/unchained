import { UnchainedCore } from '@unchainedshop/types/core.js';
import { Passport } from 'passport';
import AccessTokenStrategy from './access-token-strategy.js';

const setupPassport = (unchainedAPI: UnchainedCore) => {
  const passport = new Passport();

  passport.serializeUser(function serialize(user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function deserialize(_id, done) {
    unchainedAPI.modules.users.findUserById(_id).then(
      (user) => {
        done(null, user);
      },
      (error) => {
        done(error, null);
      },
    );
  });

  passport.use(
    new AccessTokenStrategy(function verify(token, done) {
      unchainedAPI.modules.users.findUserByToken(token).then(
        (user) => {
          done(null, user);
        },
        (error) => {
          done(error, null);
        },
      );
    }),
  );

  return passport;
};

export default setupPassport;
