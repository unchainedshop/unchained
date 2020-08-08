import { Languages } from './collections';

Languages.createLanguage = ({ isoCode, ...languageData }) => {
  const _id = Languages.insert({
    created: new Date(),
    isoCode: isoCode.toLowerCase(),
    isActive: true,
    isBase: false,
    ...languageData,
  });
  return Languages.findOne({ _id });
};
