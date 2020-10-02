import { Accounts } from 'meteor/accounts-base';
import { WorkerDirector } from 'meteor/unchained:core-worker';

export default () => {
  // https://github.com/meteor/meteor/blob/master/packages/accounts-password/password_server.js#L766
  Accounts.sendResetPasswordEmail = (userId, email, extraTokenData) => {
    const { email: realEmail, user, token } = Accounts.generateResetToken(
      userId,
      email,
      'resetPassword',
      extraTokenData
    );

    WorkerDirector.addWork({
      type: 'MESSAGE',
      retries: 0,
      input: {
        template: 'ACCOUNT_ACTION',
        action: 'resetPassword',
        recipientEmail: realEmail,
        userId,
        token,
        extraTokenData,
      },
    });

    return { email: realEmail, user, token };
  };

  // https://github.com/meteor/meteor/blob/master/packages/accounts-password/password_server.js#L792
  Accounts.sendEnrollmentEmail = (userId, email, extraTokenData) => {
    const { email: realEmail, user, token } = Accounts.generateResetToken(
      userId,
      email,
      'enrollAccount',
      extraTokenData
    );
    WorkerDirector.addWork({
      type: 'MESSAGE',
      retries: 0,
      input: {
        template: 'ACCOUNT_ACTION',
        action: 'enrollAccount',
        recipientEmail: realEmail,
        userId,
        token,
        extraTokenData,
      },
    });

    return { email: realEmail, user, token };
  };

  // https://github.com/meteor/meteor/blob/master/packages/accounts-password/password_server.js#L902
  Accounts.sendVerificationEmail = (userId, email, extraTokenData) => {
    const {
      email: realEmail,
      user,
      token,
    } = Accounts.generateVerificationToken(userId, email, extraTokenData);

    WorkerDirector.addWork({
      type: 'MESSAGE',
      retries: 0,
      input: {
        template: 'ACCOUNT_ACTION',
        action: 'verifyEmail',
        recipientEmail: realEmail,
        userId,
        token,
        extraTokenData,
      },
    });

    return { email: realEmail, user, token };
  };
};
