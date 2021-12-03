import { Context, Root } from '@unchainedshop/types/api';
import { Language } from '@unchainedshop/types/languages';
import { log } from 'meteor/unchained:logger';

export default async function createLanguage(
  root: Root,
  { language }: { language: Language },
  { modules, userId }: Context
) {
  log('mutation createLanguage', { userId });

  return await modules.languages.create({
    ...language,
    authorId: userId,
  }, userId);
}
