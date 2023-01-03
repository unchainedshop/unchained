import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { UserNotFoundError } from '../../../errors.js';

export default async function updateUserAvatar(
  root: Root,
  params: { avatar: any; userId: string },
  context: Context,
) {
  const { modules, services, userId } = context;
  const normalizedUserId = params.userId || userId;

  log(`mutation updateUserAvatar ${normalizedUserId}`, { userId });

  if (!(await modules.users.userExists({ userId: normalizedUserId })))
    throw new UserNotFoundError({ userId: normalizedUserId });

  const user = await modules.users.findUserById(normalizedUserId);

  const file = await services.files.uploadFileFromStream(
    {
      directoryName: 'user-avatars',
      rawFile: params.avatar,
      meta: { userId: normalizedUserId },
    },
    context,
  );

  if (user?.avatarId) {
    await services.files.removeFiles(
      {
        fileIds: [user.avatarId as string],
      },
      context,
    );
  }

  return modules.users.updateAvatar(normalizedUserId, file._id);
}
