import { Accounts } from 'meteor/accounts-base';
import { Users } from 'meteor/unchained:core-users';
import { check } from 'meteor/check';

export default async req => {
  // there is a possible current user connected!
  let loginToken = req.headers['meteor-login-token'];
  if (req.headers.authorization) {
    const [type, token] = req.headers.authorization.split(' ');
    if (type === 'Bearer') {
      loginToken = token;
    }
  }
  if (loginToken) {
    // throw an error if the token is not a string
    check(loginToken, String);

    // the hashed token is the key to find the possible current user in the db
    const hashedToken = Accounts._hashLoginToken(loginToken); // eslint-disable-line

    const currentUser = Users.findOne({
      'services.resume.loginTokens.hashedToken': hashedToken
    });

    // the current user exists
    if (currentUser) {
      // find the right login token corresponding, the current user may have
      // several sessions logged on different browsers / computers
      const tokenInformation = currentUser.services.resume.loginTokens.find(tokenInfo => tokenInfo.hashedToken === hashedToken); // eslint-disable-line

      // get an exploitable token expiration date
      const expiresAt = Accounts._tokenExpiration(tokenInformation.when); // eslint-disable-line

      // true if the token is expired
      const isExpired = expiresAt < new Date();

      // if the token is still valid, give access to the current user
      // information in the resolvers context
      if (!isExpired) {
        // return a new context object with the current user & her id
        return {
          user: currentUser,
          userId: currentUser._id
        };
      }
    }
  }

  return {};
};
