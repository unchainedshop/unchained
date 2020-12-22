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

Languages.helpers({
  makeBase() {
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
    Languages.update(this._id, {
      $set: {
        isBase: true,
        updated: new Date(),
      },
    });

    return Languages.findOne(this._id);
  },
  updateLanguage({ language }) {
    Languages.update(this._id, {
      updated: new Date(),
      $set: language,
    });
    return Languages.findOne(this._id);
  },
});
