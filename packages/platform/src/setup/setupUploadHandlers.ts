import { UnchainedCore } from '@unchainedshop/core';
import { FileDirector } from '../../../file-upload/lib/file-upload-index.js';

export const setupUploadHandlers = () => {
  FileDirector.registerFileUploadCallback<UnchainedCore>('user-avatars', async (file, context) => {
    const { services } = context;
    return services.users.updateUserAvatarAfterUpload({ file }, context);
  });
};
