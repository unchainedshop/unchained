import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { UserNotFoundError } from '../../../errors';

export default async function updateEmail(
  root: Root,
  params: { email: string; userId?: string },
  { modules, userId }: Context
) {
  const normalizedUserId = params.userId || userId;

  log(`mutation updateEmail ${params.email} ${normalizedUserId}`, { userId });

  const user = await modules.users.findUser({ userId: normalizedUserId });
  if (!user) throw new UserNotFoundError({ userId });

  await modules.accounts.updateEmail(
    normalizedUserId,
    params.email,
    user
  );

  return await modules.users.findUser({ userId: normalizedUserId });
}
