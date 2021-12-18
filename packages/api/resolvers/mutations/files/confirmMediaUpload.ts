import { log } from 'meteor/unchained:logger';

import { UserNotFoundError } from '../../../errors';
import { Context, Root } from '@unchainedshop/types/api';

export default async function confirmMediaUpload(
  root: Root,
  { mediaUploadTicketId, size, type },
  context: Context
) {
  const { modules, services, userId } = context;

  log(`mutation confirmMediaUpload `, { userId });

  if (!(await modules.users.userExists({ userId })))
    throw new UserNotFoundError({ userId });

  return await services.linkMedia(
    { externalId: mediaUploadTicketId, size, type },
    context
  );
}