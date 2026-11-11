import type { TemplateResolver } from '@unchainedshop/core';

const { EMAIL_FROM, EMAIL_WEBSITE_URL, EMAIL_WEBSITE_NAME } = process.env;

const verifyEmailEnglishConfig = {
  buttonText: 'Verify email address',
  message: 'We need to ensure that this email is yours as a commercial partner.',
  subject: `${EMAIL_WEBSITE_NAME}: Verify your email address`,
};

const passwordChangedEmailEnglishConfig = {
  message: `
    Your account password has been successfully changed.\n
  `,
  subject: `${EMAIL_WEBSITE_NAME}: Your password has been changed`,
};

const buildTextTemplate = ({
  message,
  buttonText,
  url,
}: {
  message: string;
  buttonText: string;
  url: string | null;
}) => {
  const urlSection = url
    ? `
  
  -----------------
  ${buttonText}: ${url}
  -----------------
`
    : '';

  return `  ${message}${urlSection}`;
};

const emailConfig = {
  'enroll-account': {
    url: (token) => `${EMAIL_WEBSITE_URL}/enroll-account?token=${token}`,
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
  },
  'reset-password': {
    url: (token) => `${EMAIL_WEBSITE_URL}/reset-password?token=${token}`,
    en: {
      buttonText: 'Set new password',
      message: `
        Click on „Set new password". If you don’t want to set a new password, just ignore this email.\n
      `,
      subject: `${EMAIL_WEBSITE_NAME}: Set password`,
    },
    de: {
      buttonText: 'Neues Passwort setzen',
      message: `
        Klicke auf „Neues Passwort setzen", um ein neues Passwort anzulegen.\n
        Falls du dein Passwort nicht zurücksetzen möchtest, ignoriere dieses E-Mail einfach.\n
      `,
      subject: `${EMAIL_WEBSITE_NAME}: Passwort zurücksetzen`,
    },
    fr: {
      buttonText: 'Set new password',
      message: `
        Click on „Set new password". If you don’t want to set a new password, just ignore this email.\n
      `,
      subject: `${EMAIL_WEBSITE_NAME}: Set password`,
    },
  },
  'verify-email': {
    url: (token) => `${EMAIL_WEBSITE_URL}/verify-email?token=${token}`,
    en: verifyEmailEnglishConfig,
    de: verifyEmailEnglishConfig,
    fr: verifyEmailEnglishConfig,
  },
  'login-code': {
    url: (token) => `${EMAIL_WEBSITE_URL}/login-code?token=${token}`,
    en: {
      buttonText: 'Log in',
      message: ({ code, expiresInMinutes }) =>
        `Open the link below to log in, or enter this code: ${code}\n\n  The link and the code are valid for ${expiresInMinutes} minutes and work once. If you did not ask to log in, just ignore this email.`,
      subject: `${EMAIL_WEBSITE_NAME}: Your login link`,
    },
    de: {
      buttonText: 'Anmelden',
      message: ({ code, expiresInMinutes }) =>
        `Öffne den Link unten, um dich anzumelden, oder gib diesen Code ein: ${code}\n\n  Link und Code sind ${expiresInMinutes} Minuten gültig und funktionieren einmal. Falls du dich nicht anmelden wolltest, ignoriere dieses E-Mail einfach.`,
      subject: `${EMAIL_WEBSITE_NAME}: Dein Login-Link`,
    },
    fr: {
      buttonText: 'Se connecter',
      message: ({ code, expiresInMinutes }) =>
        `Ouvre le lien ci-dessous pour te connecter, ou saisis ce code : ${code}\n\n  Le lien et le code sont valables ${expiresInMinutes} minutes et ne fonctionnent qu’une fois. Si tu n’as pas demandé à te connecter, ignore simplement cet e-mail.`,
      subject: `${EMAIL_WEBSITE_NAME}: Ton lien de connexion`,
    },
  },
  '': {
    // password changed!
    url: () => null,
    en: passwordChangedEmailEnglishConfig,
    de: passwordChangedEmailEnglishConfig,
    fr: passwordChangedEmailEnglishConfig,
  },
};

const groupDigits = (code: string) => String(code ?? '').replace(/(\d{3})(?=\d)/g, '$1 ');

export const resolveAccountActionTemplate: TemplateResolver = async (
  { userId, action, recipientEmail, token, code, expiresInMinutes },
  { modules },
) => {
  if (!token || !action) return [];

  const user = await modules.users.findUserById(userId);
  const locale = modules.users.userLocale(user);

  const { url } = emailConfig[action];
  const { subject, message, buttonText } =
    emailConfig[action][locale.language] || emailConfig[action].en;

  const text = buildTextTemplate({
    buttonText,
    message:
      typeof message === 'function' ? message({ code: groupDigits(code), expiresInMinutes }) : message,
    url: url(token),
  });

  return [
    {
      type: 'EMAIL',
      input: {
        from: EMAIL_FROM || 'noreply@unchained.local',
        to: recipientEmail || modules.users.primaryEmail(user)?.address,
        subject,
        text,
      },
    },
  ];
};
