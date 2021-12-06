import { Context } from '@unchainedshop/types/api';
import { File } from '@unchainedshop/types/files';
import { generateDbFilterById } from 'meteor/unchained:utils';

export type UpdateUserAvatarAfterUploadService = (
  params: { file: File; userId: string },
  context: Context
) => Promise<void>;

export const updateUserAvatarAfterUploadService: UpdateUserAvatarAfterUploadService =
  async ({ userId, file }, { modules, userId: currentUserId }) => {
    const user = await modules.users.findUser({ userId });

    if (user?.avatarId)
      await modules.files.removeFiles([user.avatarId as string]);

    await modules.users.updateAvatar(userId, file._id as string, currentUserId);
  };
