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

Languages.findLanguage = ({ languageId }) => {
  return Languages.findOne({ _id: languageId });
};

Languages.removeLanguage = ({ languageId }) => {
  return Languages.remove(languageId);
};

Languages.findLanguages = ({ limit, offset, includeInactive }) => {
  const selector = {};
  if (!includeInactive) selector.isActive = true;
  return Languages.find(selector, {
    skip: offset,
    limit,
  }).fetch();
};

Languages.setBase = ({ languageId }) => {
  Languages.update(
    { isBase: true },
    {
      $set: {
        isBase: false,
        updated: new Date(),
      },
    },
    { multi: true }
  );
  Languages.update(languageId, {
    $set: {
      isBase: true,
      updated: new Date(),
    },
  });

  return Languages.findOne(languageId);
};
Languages.updateLanguage = ({ languageId, language }) => {
  return Languages.update(languageId, {
    updated: new Date(),
    $set: language,
  });
};
