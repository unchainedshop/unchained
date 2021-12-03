import { log } from 'meteor/unchained:logger';

import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError } from '../../errors';

export default function confirmMediaUpload(
  root,
  { mediaUploadTicketId, size, type },
  context
) {
  log(`mutation confirmMediaUpload `, { userId: context.userId });

  const user = Users.findUser({ userId: context.userId });
  if (!user) throw new UserNotFoundError({ userId: context.userId });

  return await context.services.linkMedia(
    { externalFileId: mediaUploadTicketId, size, type },
    context
  );
}
