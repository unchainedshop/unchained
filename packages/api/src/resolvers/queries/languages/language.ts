import { Context, Root } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';
import { InvalidIdError } from '../../../errors.js';

export default async function language(
  root: Root,
  { languageId }: { languageId: string },
  { modules, userId }: Context,
) {
  log(`query language ${languageId}`, { userId });

  if (!languageId) throw new InvalidIdError({ languageId });

  return modules.languages.findLanguage({ languageId });
}
