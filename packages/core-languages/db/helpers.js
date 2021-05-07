import { systemLocale } from 'meteor/unchained:utils';
import { emit } from 'meteor/unchained:core-events';
import { Languages } from './collections';

const buildFindSelector = ({ includeInactive = false }) => {
  const selector = {};
  if (!includeInactive) selector.isActive = true;
  return selector;
};

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
  const language = Languages.findOne({ _id });
  emit('LANGUAGE_CREATE', { language });
  return language;
};

Languages.languageExists = ({ languageId }) => {
  return !!Languages.find({ _id: languageId }, { limit: 1 }).count();
};

Languages.findLanguage = ({ languageId, isoCode }) => {
  return Languages.findOne(languageId ? { _id: languageId } : { isoCode });
};

Languages.removeLanguage = ({ languageId }) => {
  const result = Languages.remove({ _id: languageId });
  emit('LANGUAGE_REMOVE', { languageId });
  return result;
};

Languages.findLanguages = ({ limit, offset, ...query }) => {
  return Languages.find(buildFindSelector(query), {
    skip: offset,
    limit,
  }).fetch();
};

Languages.count = async (query) => {
  const count = await Languages.rawCollection().countDocuments(
    buildFindSelector(query)
  );
  return count;
};

Languages.updateLanguage = ({ languageId, language }) => {
  const result = Languages.update(
    { _id: languageId },
    {
      updated: new Date(),
      $set: language,
    }
  );
  emit('LANGUAGE_UPDATE', { languageId });
  return result;
};
