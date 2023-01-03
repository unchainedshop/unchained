import { Context, Root } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, LanguageNotFoundError } from '../../../errors.js';

export default async function removeLanguage(
  root: Root,
  { languageId }: { languageId: string },
  { userId, modules }: Context,
) {
  log(`mutation removeLanguage ${languageId}`, { userId });

  if (!languageId) throw new InvalidIdError({ languageId });

  if (!(await modules.languages.languageExists({ languageId })))
    throw new LanguageNotFoundError({ languageId });

  await modules.languages.delete(languageId);

  return modules.languages.findLanguage({ languageId });
}
