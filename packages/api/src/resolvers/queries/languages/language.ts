import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import { InvalidIdError } from '../../../errors.ts';

export default async function language(
  root: never,
  { languageId }: { languageId: string },
  { modules, userId }: Context,
) {
  log(`query language ${languageId}`, { userId });

  if (!languageId) throw new InvalidIdError({ languageId });

  return modules.languages.findLanguage({ languageId });
}
