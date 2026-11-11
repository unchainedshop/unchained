import { log } from '@unchainedshop/logger';
import type { UserProfile } from '@unchainedshop/core-users';
import type { Context } from '../../../context.ts';
import { UserNotFoundError } from '../../../errors.ts';
import { checkAction } from '../../../acl.ts';
import { actions } from '../../../roles/index.ts';

export default async function updateUserProfile(
  root: never,
  params: { profile: UserProfile; meta?: any; userId: string },
  context: Context,
) {
  const { modules, userId } = context;
  const { userId: paramUserId, ...profile } = params;

  if (params.meta !== undefined) await checkAction(context, actions.updateUserMeta, [root, params]);
  const normalizedUserId = paramUserId || userId;

  log(`mutation updateUserProfile ${normalizedUserId}`, { userId });

  if (!(await modules.users.userExists({ userId: normalizedUserId! })))
    throw UserNotFoundError({ userId: normalizedUserId });

  return modules.users.updateProfile(normalizedUserId!, profile);
}
