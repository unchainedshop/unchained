import callToAction from './shop.unchained.accounts';

const { EMAIL_WEBSITE_NAME } = process.env;

const texts = {
  en: {
    buttonText: 'Set password',
    message: `${EMAIL_WEBSITE_NAME} has set up an user account for you. Please click below to set up a password and to finish the registration.`,
    subject: `${EMAIL_WEBSITE_NAME}: You got a new account`,
  },
  de: {
    buttonText: 'Passwort setzen',
    message: `${EMAIL_WEBSITE_NAME} hat für dich ein Benutzerkonto angelegt. Bitte klicke unten um ein Passwort zu setzen und damit die Registrierung abzuschliessen.`,
    subject: `${EMAIL_WEBSITE_NAME}: Für dich wurde ein Konto eingerichtet`,
  },
  fr: {
    buttonText: 'Set password',
    message: `${EMAIL_WEBSITE_NAME} has set up an user account for you. Please click below to set up a password and to finish the registration.`,
    subject: `${EMAIL_WEBSITE_NAME}: You got a new account`,
  },
};

export default callToAction(texts);
