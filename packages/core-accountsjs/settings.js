const sendVerificationEmail = true;

const settings = {
  sendVerificationEmailAfterSignup: null,
  load({ sendVerificationEmailAfterSignup = sendVerificationEmail } = {}) {
    this.sendVerificationEmailAfterSignup = sendVerificationEmailAfterSignup;
  },
};

export default settings;
