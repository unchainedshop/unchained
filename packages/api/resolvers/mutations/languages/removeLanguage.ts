import { Context, Root } from '@unchainedshop/types/api';
import { log } from 'meteor/unchained:logger';
import { InvalidIdError, LanguageNotFoundError } from '../../../errors';

export default async function removeLanguage(
  root: Root,
  { languageId }: { languageId: string },
  { userId, modules }: Context
) {
  log(`mutation removeLanguage ${languageId}`, { userId });

  if (!languageId) throw new InvalidIdError({ languageId });

  if (!(await modules.languages.languageExists({ languageId })))
    throw new LanguageNotFoundError({ languageId });

  await modules.languages.delete(languageId, userId);

  return await modules.languages.findLanguage({ languageId });
}
