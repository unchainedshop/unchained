import { UpdateUserAvatarAfterUploadService } from '@unchainedshop/types/user';

export const updateUserAvatarAfterUploadService: UpdateUserAvatarAfterUploadService =
  async ({ userId, file }, { modules, userId: currentUserId }) => {
    const user = await modules.users.findUser({ userId });

    if (user?.avatarId) {
      await modules.files.removeFiles({
        externalFileIds: [user.avatarId as string],
      });
    }

    await modules.users.updateAvatar(userId, file._id, currentUserId);
  };
