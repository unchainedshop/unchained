import { UpdateUserAvatarAfterUploadService } from '@unchainedshop/types/user.js';

export const updateUserAvatarAfterUploadService: UpdateUserAvatarAfterUploadService = async (
  { file },
  context,
) => {
  const { modules, services } = context;
  const { userId } = file.meta as { userId: string };
  const user = await modules.users.findUserById(userId);

  if (user?.avatarId) {
    await services.files.removeFiles(
      {
        fileIds: [user.avatarId as string],
      },
      context,
    );
  }

  await modules.users.updateAvatar(userId, file._id);
};
