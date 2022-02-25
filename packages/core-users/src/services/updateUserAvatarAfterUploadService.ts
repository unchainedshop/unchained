import { UpdateUserAvatarAfterUploadService } from '@unchainedshop/types/user';

export const updateUserAvatarAfterUploadService: UpdateUserAvatarAfterUploadService = async (
  { file },
  { modules, userId: currentUserId },
) => {
  const { userId } = file.meta as { userId: string };
  const user = await modules.users.findUser({ userId });

  if (user?.avatarId) {
    await modules.files.removeFiles({
      externalFileIds: [user.avatarId as string],
    });
  }

  await modules.users.updateAvatar(userId, file._id, currentUserId);
};
