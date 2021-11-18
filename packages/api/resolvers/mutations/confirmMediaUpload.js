import { log } from 'unchained-logger';

import { Users } from 'meteor/unchained:core-users';
import { linkMedia } from 'meteor/unchained:core-files-next';
import { UserNotFoundError } from '../../errors';

export default function confirmMediaUpload(
  root,
  { mediaUploadTicketId, size, type },
  { userId }
) {
  log(`mutation confirmMediaUpload `, { userId });
  const user = Users.findUser({ userId });

  if (!user) throw new UserNotFoundError({ userId });
  return linkMedia({ mediaUploadTicketId, size, type });
}
