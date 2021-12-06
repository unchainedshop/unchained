import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { UserNotFoundError } from '../../../errors';

export default async function addEmail(
  root: Root,
  params: { email: string; userId?: string },
  { modules, userId }: Context
) {
  const normalizedUserId = params.userId || userId;

  log(`mutation addEmail ${params.email} ${normalizedUserId}`, { userId });

  const user = await modules.users.findUser({ userId: normalizedUserId });
  if (!user) throw new UserNotFoundError({ userId });

  await modules.accounts.addEmail(normalizedUserId, params.email);

  return await modules.users.findUser({ userId: normalizedUserId });
}
