import { log } from 'meteor/unchained:core-logger';

import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError } from '../../errors';

export default function linkUserAvatar(
  root,
  { mediaUploadTicketId },
  { userId }
) {
  log(`mutation linkUserAvatar `, { userId });
  const user = Users.findUser({ userId });

  if (!user) throw new UserNotFoundError({ userId });
  return Users.updateAvatarLink({
    mediaId: mediaUploadTicketId,
    userId,
  });
}
