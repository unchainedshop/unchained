import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import { InvalidIdError } from '../../../errors.ts';

export default async function linkUserAvatar(
  root: never,
  { userId, mediaId }: { userId: string; mediaId: string },
  { modules, userId: currentUserId }: Context,
) {
  log('mutation linkUserAvatar', { userId, mediaId, currentUserId });

  if (!userId) throw new InvalidIdError({ userId });
  if (!mediaId) throw new InvalidIdError({ mediaId });

  await modules.users.updateAvatar(userId, mediaId);
  return modules.users.findUserById(userId);
}
