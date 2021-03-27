import { systemLocale } from 'meteor/unchained:utils';
import { Languages } from './collections';

Languages.helpers({
  isBase() {
    return this.isoCode === systemLocale.language;
  },
});

Languages.createLanguage = ({ isoCode, ...languageData }) => {
  const _id = Languages.insert({
    created: new Date(),
    isoCode: isoCode.toLowerCase(),
    isActive: true,
    ...languageData,
  });
  return Languages.findOne({ _id });
};

Languages.languageExists = ({ languageId }) => {
  return !!Languages.find({ _id: languageId }, { limit: 1 }).count();
};

Languages.findLanguage = ({ languageId, isoCode }) => {
  return Languages.findOne(languageId ? { _id: languageId } : { isoCode });
};

Languages.removeLanguage = ({ languageId }) => {
  return Languages.remove({ _id: languageId });
};

Languages.findLanguages = ({ limit, offset, includeInactive }) => {
  const selector = {};
  if (!includeInactive) selector.isActive = true;
  return Languages.find(selector, {
    skip: offset,
    limit,
  }).fetch();
};

Languages.count = async ({ includeInactive }) => {
  const selector = {};
  if (!includeInactive) selector.isActive = true;
  const count = await Languages.rawCollection().countDocuments(selector);
  return count;
};

Languages.updateLanguage = ({ languageId, language }) => {
  return Languages.update(
    { _id: languageId },
    {
      updated: new Date(),
      $set: language,
    }
  );
};
