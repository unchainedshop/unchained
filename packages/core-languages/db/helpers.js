import { Languages } from './collections';

Languages.createLanguage = ({ isoCode, ...countryData }) => {
  const _id = Languages.insert({
    created: new Date(),
    isoCode: isoCode.toLowerCase(),
    isActive: true,
    isBase: false,
    ...countryData
  });
  return Languages.findOne({ _id });
};
