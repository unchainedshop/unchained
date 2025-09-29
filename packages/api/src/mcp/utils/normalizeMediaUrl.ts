import { AssortmentMediaType } from '@unchainedshop/core-assortments';
import { getFileAdapter } from '@unchainedshop/core-files';
import { ProductMedia } from '@unchainedshop/core-products';

const normalizeMediaUrl = async (medias: (AssortmentMediaType | ProductMedia)[] = [], context) => {
  if (medias?.length) {
    const normalizedMedias = await Promise.all(
      medias
        .map(async (media) => {
          const file = await context.loaders.fileLoader.load({
            fileId: media.mediaId,
          });
          if (!file) return null;
          const fileUploadAdapter = getFileAdapter();
          const url = await fileUploadAdapter.createDownloadURL(file);
          file.url = context.modules.files.normalizeUrl(url, {});

          return {
            ...media,
            file,
          };
        })
        .filter(Boolean),
    );

    return normalizedMedias.filter(Boolean);
  }
  return medias;
};

export default normalizeMediaUrl;
