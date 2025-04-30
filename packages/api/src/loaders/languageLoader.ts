import { UnchainedCore } from '@unchainedshop/core';
import { Language } from '@unchainedshop/core-languages';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ isoCode: string }, Language>(async (queries) => {
    const isoCodes = [...new Set(queries.map((q) => q.isoCode).filter(Boolean))]; // you don't need lodash, _.unique my ass

    const languages = await unchainedAPI.modules.languages.findLanguages({
      isoCode: { $in: isoCodes },
      includeInactive: true,
    });

    const languageMap = {};
    for (const language of languages) {
      languageMap[language.isoCode] = language;
    }

    return queries.map((q) => languageMap[q.isoCode]);
  });
