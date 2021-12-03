import { log } from 'meteor/unchained:logger';

import { Users } from 'meteor/unchained:core-users';
import { UserNotFoundError } from '../../../errors';
import { Context, Root } from '@unchainedshop/types/api';

export default async function confirmMediaUpload(
  root: Root,
  { mediaUploadTicketId, size, type },
  context: Context
) {
  log(`mutation confirmMediaUpload `, { userId: context.userId });

  const user = Users.findUser({ userId: context.userId });
  if (!user) throw new UserNotFoundError({ userId: context.userId });

  return await context.services.linkMedia(
    { externalFileId: mediaUploadTicketId, size, type },
    context
  );
}
