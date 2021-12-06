import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { UserNotFoundError, InvalidIdError } from '../../../errors';

export default async function setUsername(
  root: Root,
  params: { username: string, userId: string },
  { modules, userId }: Context
) {
  const normalizedUserId = params.userId || userId

  log(`mutation setUsername ${normalizedUserId}`, { userId });
  
  if (!normalizedUserId) throw new InvalidIdError({ userId: normalizedUserId });
  const user = await modules.users.findUser({ userId: normalizedUserId });
  if (!user) throw new UserNotFoundError({ userId });

  await modules.accounts.setUsername(normalizedUserId, params.username);
  
  return user
}
