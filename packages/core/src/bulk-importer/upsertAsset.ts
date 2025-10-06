import { Modules } from '../modules.js';
import { Services } from '../services/index.js';
import { z } from 'zod';

export const AssetSchema = z.object({
  _id: z.string().optional(),
  url: z.string(),
  meta: z.record(z.unknown()).optional(),
  fileName: z.string(),
  headers: z.record(z.string()).optional(),
});

const upsertAsset = async (
  directoryName: string,
  asset: z.infer<typeof AssetSchema>,
  unchainedAPI: { modules: Modules; services: Services },
) => {
  const { modules, services } = unchainedAPI;
  const { _id: fileId, fileName, url, meta, headers, ...assetData } = asset;

  try {
    const existingFile = fileId && (await modules.files.findFile({ fileId }));
    if (existingFile) {
      if (JSON.stringify(meta) === JSON.stringify(existingFile.meta)) {
        return existingFile;
      }
      await modules.files.update(fileId, { meta, ...assetData });
      const updatedFile = await modules.files.findFile({ fileId });
      return updatedFile;
    }

    const assetObject = await services.files.uploadFileFromURL({
      directoryName,
      fileInput: {
        fileLink: url,
        fileName,
        fileId,
        headers,
      },
      meta,
    });

    if (!assetObject) throw new Error('Media not created');
    return assetObject;
  } catch {
    return null;
  }
};

export default upsertAsset;
