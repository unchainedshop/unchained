import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { UserNotFoundError } from '../../../errors';

export default async function updateUserAvatar(
  root: Root,
  params: { avatar: any; userId: string },
  { modules, userId }: Context
) {
  const normalizedUserId = params.userId || userId;

  log(`mutation updateUserAvatar ${normalizedUserId}`, { userId });

  if (!(await modules.users.userExists({ userId: normalizedUserId })))
    throw new UserNotFoundError({ userId: normalizedUserId });

  const file = await modules.files.uploadFileFromStream(
    {
      directoryName: 'user-avatars',
      rawFile: params.avatar,
      meta: { userId: normalizedUserId },
    },
    userId
  );

  return await modules.users.updateAvatar(
    normalizedUserId,
    file._id,
    userId
  );
}
