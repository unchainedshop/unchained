import { UnchainedCore } from '@unchainedshop/core';
import { FileDirector } from '@unchainedshop/file-upload';

export const setupUploadHandlers = ({ services, modules }: UnchainedCore) => {
  FileDirector.registerFileUploadCallback('user-avatars', async (file) => {
    return services.users.updateUserAvatarAfterUpload({ file });
  });

  FileDirector.registerFileUploadCallback('product-media', async (file) => {
    await modules.products.media.create({
      productId: file.meta?.productId as string,
      mediaId: file._id,
    });
  });

  FileDirector.registerFileUploadCallback('assortment-media', async (file) => {
    await modules.assortments.media.create({
      assortmentId: file.meta.assortmentId as string,
      mediaId: file._id,
    });
  });
};
