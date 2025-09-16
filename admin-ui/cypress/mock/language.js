export const LanguagesResponse = {
  data: {
    languages: [
      {
        _id: '3d8f7cff0b038f582c48417d',
        isActive: true,
        isBase: true,
        isoCode: 'en',
        name: 'en (Base)',
        __typename: 'Language',
      },
      {
        _id: '401d3dcaffada1d7942a567c',
        isoCode: 'de',
        isActive: true,
        isBase: true,
        name: 'de (Base)',
        __typename: 'Language',
      },
    ],
    languagesCount: 2,
  },
};

export const SingleLanguageResponse = {
  data: {
    language: {
      _id: '3d8f7cff0b038f582c48417d',
      isoCode: 'de',
      isActive: true,
      isBase: true,
      name: 'de (Base)',
      __typename: 'Language',
    },
  },
};

export const CreateLanguageResponse = {
  data: {
    createLanguage: {
      _id: '3d8f7cff0b038f582c48417d',
      __typename: 'Language',
    },
  },
};

export const UpdateLanguageResponse = {
  data: {
    updateLanguage: {
      _id: '3d8f7cff0b038f582c48417d',
      __typename: 'Language',
    },
  },
};

export const RemoveLanguageResponse = {
  data: {
    removeLanguage: {
      _id: '3d8f7cff0b038f582c48417d',
      __typename: 'Language',
    },
  },
};

export const LanguageOperations = {
  GetLanguagesList: 'Languages',
  GetSingleLanguage: 'Language',
  CreateLanguage: 'CreateLanguage',
  UpdateLanguage: 'UpdateLanguage',
  RemoveLanguage: 'RemoveLanguage',
};

const LanguageMocks = { LanguagesResponse, LanguageOperations };

export default LanguageMocks;
