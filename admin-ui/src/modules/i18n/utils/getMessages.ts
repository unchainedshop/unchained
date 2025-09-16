import defaultTranslations from '../../../i18n';

const getMessages = (locale) => {
  const language = locale?.split('-')?.shift() || 'de';
  return { ...defaultTranslations /* , ...extendedLanguages */ }[language];
};

export default getMessages;
