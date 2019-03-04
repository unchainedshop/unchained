import callToAction from "./shop.unchained.accounts";

const { EMAIL_WEBSITE_NAME } = process.env;

const texts = {
  en: {
    buttonText: "Set new password",
    message: `
      Click on „Set new password". If you don’t want to set a new password, just ignore this email.\n
    `,
    subject: `${EMAIL_WEBSITE_NAME}: Set password`
  },
  de: {
    buttonText: "Neues Passwort setzen",
    message: `
      Klicke auf „Neues Passwort setzen", um ein neues Passwort anzulegen.\n
      Falls du dein Passwort nicht zurücksetzen möchtest, ignoriere dieses E-Mail einfach.\n
    `,
    subject: `${EMAIL_WEBSITE_NAME}: Passwort zurücksetzen`
  },
  fr: {
    buttonText: "Set new password",
    message: `
      Click on „Set new password". If you don’t want to set a new password, just ignore this email.\n
    `,
    subject: `${EMAIL_WEBSITE_NAME}: Set password`
  }
};
export default callToAction(texts);
