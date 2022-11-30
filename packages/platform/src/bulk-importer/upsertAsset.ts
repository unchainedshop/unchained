import { Context } from '@unchainedshop/types/api';
import { File } from '@unchainedshop/types/files';

const upsertAsset = async (
  directoryName: string,
  asset: File & { fileName: string; headers?: Record<string, unknown> },
  unchainedAPI: Context,
) => {
  const { modules, services } = unchainedAPI;
  const { _id: fileId, fileName, url, meta, headers, ...assetData } = asset;

  try {
    const existingFile = fileId && (await modules.files.findFile({ fileId }));
    if (existingFile) {
      const newMeta = { ...meta, fileId };
      if (JSON.stringify(newMeta) === JSON.stringify(existingFile.meta)) {
        return existingFile;
      }
      await modules.files.update(fileId, { meta: newMeta, ...assetData });
      const updatedFile = await modules.files.findFile({ fileId });
      return updatedFile;
    }

    const assetObject = await services.files.uploadFileFromURL(
      {
        directoryName,
        fileInput: {
          fileLink: url,
          fileName,
          headers,
        },
        meta: { ...meta, fileId },
      },
      unchainedAPI,
    );

    if (!assetObject) throw new Error('Media not created');
    return assetObject;
  } catch (e) {
    return null;
  }
};

export default upsertAsset;
