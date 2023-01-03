import { Context, Root } from '@unchainedshop/types/api.js';
import { Language } from '@unchainedshop/types/languages.js';
import { log } from '@unchainedshop/logger';

export default async function createLanguage(
  root: Root,
  { language }: { language: Language },
  { modules, userId }: Context,
) {
  log('mutation createLanguage', { userId });

  const languageId = await modules.languages.create({
    ...language,
  });

  return modules.languages.findLanguage({ languageId });
}
