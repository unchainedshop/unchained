import { UpdateUserAvatarAfterUploadService } from '@unchainedshop/types/user';

export const updateUserAvatarAfterUploadService: UpdateUserAvatarAfterUploadService = async (
  { file },
  context,
) => {
  const { modules, services, userId: currentUserId } = context;
  const { userId } = file.meta as { userId: string };
  const user = await modules.users.findUser({ userId });

  if (user?.avatarId) {
    await services.files.removeFiles(
      {
        fileIds: [user.avatarId as string],
      },
      context,
    );
  }

  await modules.users.updateAvatar(userId, file._id, currentUserId || file.updatedBy || file.createdBy);
};
