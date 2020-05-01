import callToAction from './shop.unchained.accounts';

const { EMAIL_WEBSITE_NAME } = process.env;

const texts = {
  en: {
    buttonText: 'Verify email address',
    message:
      'We need to ensure that this email is yours as a commercial partner.',
    subject: `${EMAIL_WEBSITE_NAME}: Verify your email address`,
  },
  de: {
    buttonText: 'E-Mail Adresse verifizieren',
    message:
      'Als Geschäftskunde müssen wir sicherstellen, dass diese E-Mail Adresse dir gehört.',
    subject: `${EMAIL_WEBSITE_NAME}: Verifiziere deine E-Mail Adresse`,
  },
  fr: {
    buttonText: 'Verify email address',
    message:
      'We need to ensure that this email is yours as a commercial partner.',
    subject: `${EMAIL_WEBSITE_NAME}: Verify your email address`,
  },
};
export default callToAction(texts);
