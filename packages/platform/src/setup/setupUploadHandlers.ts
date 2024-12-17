import { UnchainedCore } from '@unchainedshop/core';
import { FileDirector } from '@unchainedshop/file-upload';

export const setupUploadHandlers = () => {
  FileDirector.registerFileUploadCallback<UnchainedCore>('user-avatars', async (file, context) => {
    const { services } = context;
    return services.users.updateUserAvatarAfterUpload({ file });
  });
};
