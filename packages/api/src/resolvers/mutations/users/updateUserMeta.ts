import { Context, Root } from '@unchainedshop/types/api';
import { log } from 'meteor/unchained:logger';
import { InvalidIdError, UserNotFoundError } from '../../../errors';

export default async function updateUserMeta(
  root: Root,
  params: { meta: Array<string>; userId: string },
  { modules, userId }: Context,
) {
  const normalizedUserId = params.userId;

  log(`mutation updateUserMeta ${normalizedUserId}`, { userId });

  if (!normalizedUserId) throw new InvalidIdError({ normalizedUserId });
  if (!(await modules.users.userExists({ userId: normalizedUserId })))
    throw new UserNotFoundError({ userId: normalizedUserId });

  return modules.users.updateMeta(normalizedUserId, params.meta, userId);
}
