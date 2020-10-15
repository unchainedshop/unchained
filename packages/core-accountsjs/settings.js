const loginTokenExpirationInDays = 90;
const loginUnexpiringTokenDays = 365 * 100;
const sendVerificationEmail = true;

const settings = {
  load({
    DEFAULT_LOGIN_EXPIRATION_DAYS = loginTokenExpirationInDays,
    LOGIN_UNEXPIRING_TOKEN_DAYS = loginUnexpiringTokenDays,
    sendVerificationEmailAfterSignup = sendVerificationEmail,
  } = {}) {
    this.DEFAULT_LOGIN_EXPIRATION_DAYS = DEFAULT_LOGIN_EXPIRATION_DAYS;
    this.LOGIN_UNEXPIRING_TOKEN_DAYS = LOGIN_UNEXPIRING_TOKEN_DAYS;
    this.sendVerificationEmailAfterSignup = sendVerificationEmailAfterSignup;
  },
};

export default settings;
