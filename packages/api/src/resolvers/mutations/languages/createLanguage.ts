import { Context } from '../../../types.js';
import { Language } from '@unchainedshop/core-languages';
import { log } from '@unchainedshop/logger';

export default async function createLanguage(
  root: never,
  { language }: { language: Language },
  { modules, userId }: Context,
) {
  log('mutation createLanguage', { userId });

  const languageId = await modules.languages.create({
    ...language,
  });

  return modules.languages.findLanguage({ languageId });
}
